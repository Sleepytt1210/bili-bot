import {getLogger, Logger} from "../utils/logger.js";
import {SongInfo} from "../data/model/song-info.js";
import {Guild, GuildMember, Message, EmbedBuilder, MessageReaction, TextChannel} from "discord.js";
import {BiliSongEntity} from "../data/datasources/bilibili-api.js";
import {CommandEngine} from "../commands/command-engine.js";
import {CommandException} from "../commands/base-command.js";
import {PlaylistManager} from "../data/managers/playlist-manager.js";
import {QueueManager} from "../data/managers/queue-manager.js";
import {SongDoc} from "../data/db/schemas/song.js";
import {PlaylistDoc} from "../data/db/schemas/playlist.js";
import {biliblue, EmbedOptions, generateEmbed} from "../utils/utils.js";
import redis from "../utils/redis.js";

export class GuildManager {
    protected readonly logger: Logger;
    public readonly id: string;
    public readonly guild: Guild;
    public readonly queueManager: QueueManager;
    public activeTextChannel: TextChannel;
    public commandPrefix: string;
    public readonly commandEngine: CommandEngine;
    public readonly dataManager: PlaylistManager;
    public inorinBvid: string;

    public constructor(guild: Guild, prefix = '~') {
        this.logger = getLogger(`GuildManager-${guild.id}`);
        this.id = guild.id;
        this.guild = guild;
        this.queueManager = new QueueManager(this);
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

    public async getCurrentSearchResult(userid: string): Promise<BiliSongEntity[] | null> {
        const searchCacheKey = `searchrs-${this.guild.id}-${userid}`;
        return (JSON.parse(await redis.get(searchCacheKey)) as BiliSongEntity[]);
    }
    
    public async setCurrentSearchResult(result: null | BiliSongEntity[], userid: string): Promise<void> {
        const searchCacheKey = `searchrs-${this.guild.id}-${userid}`;
        const showlistCacheKey = `pllrs-${this.guild.id}-${userid}`;
        await this.setOrDel(searchCacheKey, result);
        await redis.del(showlistCacheKey); // Delete showlist cache key
    }

    public async getCurrentShowlistResult(userid: string): Promise<SongDoc[] | null> {
        const showlistCacheKey = `pllrs-${this.guild.id}-${userid}`;
        return JSON.parse(await redis.get(showlistCacheKey)) as SongDoc[];
    }

    public async setCurrentShowlistResult(result: null | SongDoc[], userid: string): Promise<void> {
        const searchCacheKey = `searchrs-${this.guild.id}-${userid}`;
        const showlistCacheKey = `pllrs-${this.guild.id}-${userid}`;
        await this.setOrDel(showlistCacheKey, result);
        await redis.del(searchCacheKey); // Delete search cache key
    }

    public async getCurrentPlaylist(userid: string): Promise<PlaylistDoc | null> {
        const playlistCacheKey = `cslpl-${this.guild.id}-${userid}`;
        return JSON.parse(await redis.get(playlistCacheKey)) as PlaylistDoc;
    }

    public async setCurrentPlaylist(result: null | PlaylistDoc, userid: string): Promise<void> {
        const playlistCacheKey = `cslpl-${this.guild.id}-${userid}`;
        await this.setOrDel(playlistCacheKey, result);
    }

    private async setOrDel(key: string, value: any): Promise<void> {
        if (value == null) {
            await redis.del(key);
        } else {
            await redis.set(key, JSON.stringify(value), 5 * 60); // Expires after 5 minutes
        }
    }

    public setPrefix(prefix: string): void {
        this.commandPrefix = prefix;
    }

    public printEvent(desc: string, isTransient = false): void {
        const embed = new EmbedBuilder()
            .setDescription(desc)
            .setColor(biliblue);
        this.printEmbeds(embed, isTransient);
    }

    public printPlaying(song: SongInfo): void {
        const embed = new EmbedBuilder()
            .setTitle(`Now playing: `)
            .setDescription(`**[${song.title}](${song.url})** --> *Requested by:* <@${song.initiator.id}>`)
            .setFooter({text: `Duration: ${song.hmsDuration}`, iconURL: song.initiator.user.avatarURL()})
            .setColor(biliblue);
        this.printEmbeds(embed);
    }

    public printOutOfSongs(): void {
        const embed = new EmbedBuilder().setDescription("Running out of songs")
            .setColor(biliblue);
        this.printEmbeds(embed);
    }

    public printAddToQueue(song: SongInfo, queueLength: number, isPlaylist?: boolean): void {
        const embed = new EmbedBuilder()
            .setDescription(`**[${song.title}](${song.url})** is added to queue, current number of songs in the list: ${queueLength}`);
        this.printEmbeds(embed, isPlaylist);
    }

    public printEmbeds(embed: EmbedBuilder | EmbedBuilder[], isTransient?: boolean): void {
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
        } else if (requireSameChannel && this.guild.members.me.voice.channel && member.voice.channelId != this.guild.members.me.voice.channelId) {
            throw CommandException.UserPresentable("You cannot use this command if you are not in the channel I'm playing");
        } else {
            this.queueManager.joinChannel(member);
        }
    }
}
