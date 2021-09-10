import {Logger, getLogger} from "../utils/logger";
import {BilibiliSong} from "../data/model/bilibili-song";
import {Guild, GuildMember, Message, MessageEmbed, MessageReaction, TextChannel} from "discord.js";
import {SearchSongEntity} from "../data/datasources/bilibili-api";
import {CommandEngine} from "../commands/command-engine";
import {CommandException} from "../commands/base-command";
import {PlaylistManager} from "../data/managers/playlist-manager";
import {QueueManager} from "../data/managers/queue-manager";
import {SongDoc} from "../data/db/schemas/song";
import {PlaylistDoc} from "../data/db/schemas/playlist";

export class GuildManager {
    protected readonly logger: Logger;
    public readonly id: string;
    public readonly guild: Guild;
    public readonly queueManager: QueueManager;
    public activeTextChannel: TextChannel;
    public currentSearchResult?: SearchSongEntity[];
    public currentShowlistResult: Map<string, SongDoc[]>;
    public currentPlaylist: Map<string, PlaylistDoc>;
    public commandPrefix: string;
    public readonly commandEngine: CommandEngine;
    public readonly dataManager: PlaylistManager;
    public previousCommand: "search" | "showlist" | "playlists"| "load";
    public inorinBvid: string;

    public constructor(guild: Guild, prefix: string = '~') {
        this.logger = getLogger(`GuildManager-${guild.id}`);
        this.id = guild.id;
        this.guild = guild;
        this.queueManager = new QueueManager(this);
        this.currentPlaylist = new Map<string, PlaylistDoc>();
        this.currentShowlistResult = new Map<string, SongDoc[]>();
        this.previousCommand = null;
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

    public async joinChannel(message: Message): Promise<void> {
        this.queueManager.activeConnection = await message.member.voice.channel.join();
    }

    public setPreviousCommand(command: null | "search" | "showlist" | "playlists"| "load"): void {
        this.previousCommand = command;
    }

    public setCurrentSearchResult(result: null | SearchSongEntity[]): void {
        this.currentSearchResult = result;
    }

    public setCurrentShowlistResult(result: null | SongDoc[], userid: string): void {
        this.currentShowlistResult.set(userid, result);
    }

    public setCurrentPlaylist(result: PlaylistDoc | null, userid: string): void {
        this.currentPlaylist.set(userid, result);
    }

    public setPrefix(prefix: string): void {
        this.commandPrefix = prefix;
    }

    public printEvent(desc: string): void{
        const embed = new MessageEmbed()
            .setDescription(desc)
            .setColor(0x0ACDFF);
        this.printEmbeds(embed);
    }

    public printPlaying(song: BilibiliSong): void {
        const embed = new MessageEmbed()
            .setTitle(`Now playing: `)
            .setDescription(`**[${song.title}](${song.url})** --> *Requested by:* <@${song.initiator.id}>`)
            .setFooter(`Duration: ${song.hmsDuration}`, song.initiator.avatarURL());
        this.printEmbeds(embed);
    }

    public printOutOfSongs(): void {
        this.printEmbeds(new MessageEmbed().setDescription("Running out of songs"));
    }

    public printAddToQueue(song: BilibiliSong, queueLength: number): void {
        const embed = new MessageEmbed()
            .setDescription(`**[${song.title}](${song.url})** is added to queue, current number of songs in the list: ${queueLength}`);
        this.printEmbeds(embed);
    }

    public printEmbeds(embed: MessageEmbed | MessageEmbed[]): void {
        if(Array.isArray(embed)){
            for (const e of embed) {
                e.setColor(0x0ACDFF);
            }
        }else{
            embed.setColor(0x0ACDFF);
        }
        const embedMsg = Array.isArray(embed) ? embed : [embed]
        this.activeTextChannel.send({embeds: embedMsg});
    }

    public printFlipPages(list: any[], embed: (n: number) => MessageEmbed, message: Message): void {
        let currentPage = 1;

        message.channel.send({embeds: [embed(0)]}).then((msg): Promise<void> => {
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
                    msg.edit({embeds: [embed((currentPage - 1) * 10)]});
                    return r.users.remove(u);
                });
                nextCollector.on('collect', (r, u): Promise<MessageReaction> => {
                    if (currentPage === Math.ceil((list.length / 10))) return r.users.remove(u);
                    currentPage++;
                    msg.edit({embeds: [embed((currentPage - 1) * 10)]});
                    return r.users.remove(u);
                });
            });
        });
    }

    public checkMemberInChannel(member: GuildMember, requireSameChannel: boolean = true): void {
        if (!member.voice || !member.voice.channel) {
            throw CommandException.UserPresentable('You are not in a voice channel');
        } else if (requireSameChannel && this.guild.me.voice.channel && member.voice.channelId != this.guild.me.voice.channelId) {
            throw CommandException.UserPresentable("You cannot use this command if you are not in the channel I'm playing");
        } else {
            return;
        }
    }
}
