import {getLogger, Logger} from "../utils/logger";
import {SongInfo} from "../data/model/song-info";
import {Guild, GuildMember, Message, MessageEmbed, MessageReaction, TextChannel} from "discord.js";
import {BiliSongEntity} from "../data/datasources/bilibili-api";
import {CommandEngine} from "../commands/command-engine";
import {CommandException} from "../commands/base-command";
import {PlaylistManager} from "../data/managers/playlist-manager";
import {QueueManager} from "../data/managers/queue-manager";
import {SongDoc} from "../data/db/schemas/song";
import {PlaylistDoc} from "../data/db/schemas/playlist";
import {biliblue, EmbedOptions, generateEmbed} from "../utils/utils";
import Timeout = NodeJS.Timeout;

export class GuildManager {
    protected readonly logger: Logger;
    public readonly id: string;
    public readonly guild: Guild;
    public readonly queueManager: QueueManager;
    public activeTextChannel: TextChannel;
    public currentSearchResult?: Map<string, BiliSongEntity[]>;
    public currentSearchTimer: Map<string, Timeout>;
    public currentShowlistResult: Map<string, SongDoc[]>;
    public currentShowlistTimer: Map<string, Timeout>;
    public currentPlaylist: Map<string, PlaylistDoc>;
    public commandPrefix: string;
    public readonly commandEngine: CommandEngine;
    public readonly dataManager: PlaylistManager;
    public inorinBvid: string;

    public constructor(guild: Guild, prefix = '~') {
        this.logger = getLogger(`GuildManager-${guild.id}`);
        this.id = guild.id;
        this.guild = guild;
        this.queueManager = new QueueManager(this);
        this.currentSearchResult = new Map<string, BiliSongEntity[]>();
        this.currentShowlistResult = new Map<string, SongDoc[]>();
        this.currentPlaylist = new Map<string, PlaylistDoc>();
        this.currentSearchTimer = new Map<string, NodeJS.Timeout>();
        this.currentShowlistTimer = new Map<string, NodeJS.Timeout>();
        this.commandPrefix = prefix;
        this.commandEngine = new CommandEngine(this);
        this.dataManager = new PlaylistManager(this);
        this.inorinBvid = "BV1rx411j75n";
    }

    public async processMessage(msg: Message): Promise<void> {
        if (msg.content.startsWith(this.commandPrefix)) {
            this.logger.info(`Processing command: ${msg.content}`);
            const command = msg.content.slice(this.commandPrefix.length);
            const args = command.split(/\s+/);
            if (args.length < 1) return;
            this.activeTextChannel = msg.channel as TextChannel;
            await this.commandEngine.process(msg, args);
        }
    }

    // HELPER FUNCTIONS

    public setCurrentSearchResult(result: null | BiliSongEntity[], userid: string): void {
        this.currentSearchResult.set(userid, result);
        this.currentShowlistResult.set(userid, null);
    }

    public setCurrentSearchTimer(timer: null | Timeout, userid: string): void {
        this.currentSearchTimer.set(userid, timer);
    }

    public setCurrentShowlistResult(result: null | SongDoc[], userid: string): void {
        this.currentShowlistResult.set(userid, result);
        this.currentSearchResult.set(userid, null);
    }

    public setCurrentShowlistTimer(timer: null | Timeout, userid: string): void {
        this.currentShowlistTimer.set(userid, timer);
    }

    public setCurrentPlaylist(result: PlaylistDoc | null, userid: string): void {
        this.currentPlaylist.set(userid, result);
    }

    public setPrefix(prefix: string): void {
        this.commandPrefix = prefix;
    }

    public printEvent(desc: string, isTransient = false): void {
        const embed = new MessageEmbed()
            .setDescription(desc)
            .setColor(biliblue);
        this.printEmbeds(embed, isTransient);
    }

    public printPlaying(song: SongInfo): void {
        const embed = new MessageEmbed()
            .setTitle(`Now playing: `)
            .setDescription(`**[${song.title}](${song.url})** --> *Requested by:* <@${song.initiator.id}>`)
            .setFooter(`Duration: ${song.hmsDuration}`, song.initiator.user.avatarURL())
            .setColor(biliblue);
        this.printEmbeds(embed);
    }

    public printOutOfSongs(): void {
        const embed = new MessageEmbed().setDescription("Running out of songs")
            .setColor(biliblue);
        this.printEmbeds(embed);
    }

    public printAddToQueue(song: SongInfo, queueLength: number, isPlaylist?: boolean): void {
        const embed = new MessageEmbed()
            .setDescription(`**[${song.title}](${song.url})** is added to queue, current number of songs in the list: ${queueLength}`);
        this.printEmbeds(embed, isPlaylist);
    }

    public printEmbeds(embed: MessageEmbed | MessageEmbed[], isTransient?: boolean): void {
        if(Array.isArray(embed)){
            for (const e of embed) {
                e.setColor(biliblue);
            }
        }else{
            embed.setColor(biliblue);
        }
        const embedMsg = Array.isArray(embed) ? embed : [embed]
        this.activeTextChannel.send({embeds: embedMsg}).then((msg): void => {
            if(isTransient) {
                if(msg.deletable) {
                    setTimeout((): Promise<Message> => msg.delete(), 10000)
                } else {
                    CommandException.UserPresentable("Message can't be deleted!");
                }
            }
        });
    }

    public printFlipPages(list: SongInfo[] | PlaylistDoc[] | BiliSongEntity[] | SongDoc[], embedOptions: EmbedOptions, message: Message): void {
        let currentPage = 1;

        message.channel.send({embeds: [generateEmbed(embedOptions)]}).then((msg): Promise<void> => {
            if (list.length <= 10) return;

            msg.react('⬅').then((_): void => {
                msg.react('➡');

                const prevFilter = (reaction, user): boolean => reaction.emoji.name === '⬅' && user.id === message.author.id;
                const nextFilter = (reaction, user): boolean => reaction.emoji.name === '➡' && user.id === message.author.id;

                const prevCollector = msg.createReactionCollector({filter: prevFilter, time: 300000});
                const nextCollector = msg.createReactionCollector({filter: nextFilter, time: 300000});

                prevCollector.on('collect', (r, u): Promise<MessageReaction> => {
                    if (currentPage === 1) return r.users.remove(u);
                    currentPage--;
                    embedOptions["start"] = (currentPage - 1) * 10;
                    msg.edit({embeds: [generateEmbed(embedOptions)]});
                    return r.users.remove(u);
                });
                nextCollector.on('collect', (r, u): Promise<MessageReaction> => {
                    if (currentPage === Math.ceil((list.length / 10))) return r.users.remove(u);
                    currentPage++;
                    embedOptions["start"] = (currentPage - 1) * 10
                    msg.edit({embeds: [generateEmbed(embedOptions)]});
                    return r.users.remove(u);
                });
            });
        });
    }

    public checkMemberInChannel(member: GuildMember, requireSameChannel = true): void {
        if (!member.voice || !member.voice.channel) {
            throw CommandException.UserPresentable('You are not in a voice channel');
        } else if (requireSameChannel && this.guild.me.voice.channel && member.voice.channelId != this.guild.me.voice.channelId) {
            throw CommandException.UserPresentable("You cannot use this command if you are not in the channel I'm playing");
        } else {
            this.queueManager.joinChannel(member);
        }
    }
}
