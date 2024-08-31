import { BaseCommand, CommandException } from "../base-command";
import { CommandType } from "../command-type";
import { Message, EmbedBuilder } from "discord.js";
import { GuildManager } from "../../app/guild";
import { helpTemplate } from "../../utils/utils";
import { bvidExtract, toHms } from "../data/datasources/bilibili-api.js";
import ytdl from "ytdl-core";
import { SongInfo } from "../data/model/song-info.js";
import { AudioPlayerState, AudioPlayerStatus } from "@discordjs/voice";

export class InfoCommand extends BaseCommand {

    public name: CommandType = CommandType.INFO;

    public constructor() {
        super(['i', 'np', 'nowplaying']);
    }

    public async executeHandler(member: GuildMember, guild: GuildManager, args: Omit<CommandInteractionOptionResolver<CacheType>, "getMessage" | "getFocused">, interaction: ChatInputCommandInteraction): Promise<void> {
        if (args.length === 0) {
            await this.processResult(message, guild);
        } else if (args.length === 1) {
            const url = args.shift();
            if (ytdl.validateURL(url) || bvidExtract(url)) await this.processResult(message, guild, url);
            else throw CommandException.UserPresentable(`Invalid url ${url}`);
        }
    }

    private async processResult(message: Message, guild: GuildManager, url?: string): Promise<void> {
        const currentSong = (url) ? await SongInfo.withUrl(url, member) : guild.queueManager.currentSong;
        if (!currentSong && !guild.queueManager.currentSong) {
            guild.printEvent('No song is playing!');
        }
        this.logger.info(`Queried song: ${currentSong.title}`);
        const embed = await this.urlInfo(currentSong);
        if (!url) {
            const audioPlayer = guild.queueManager.audioPlayer;
            const playerState: AudioPlayerState = audioPlayer.state;
            const pbDur = (playerState.status !== AudioPlayerStatus.Idle) ? playerState.resource.playbackDuration : 0;
            const streamTime = Math.floor(pbDur / 1000);
            const stHms = toHms(streamTime);
            const playTime = Math.floor((streamTime * 15) / (currentSong.rawDuration)) + 1;
            const isPaused = (playerState.status === AudioPlayerStatus.Paused || playerState.status === AudioPlayerStatus.AutoPaused);
            const emoji = (isPaused) ? "<a:Zawarudo:757243016615559270>" : "<a:Rainbow_Weeb:640863491229614080>";
            const show = [emoji + "  ", "▬", "▬", "▬", "▬", "▬", "▬", "▬", "▬", "▬", "▬", "▬", "▬", "▬", "▬", "▬"];
            show[playTime] = "<a:WoopWoop:640863532866469888>";
            show.push(" " + stHms + "/" + currentSong.hmsDuration);
            const showString = show.join("");
            embed.addFields({ name: 'Progress: ', value: showString })
        } else {
            embed.addFields({ name: 'Duration: ', value: currentSong.hmsDuration });
        }
        guild.printEmbeds(embed);
    }

    private async urlInfo(song?: SongInfo): Promise<EmbedBuilder> {
        return new EmbedBuilder()
            .setTitle(song.title)
            .setTimestamp()
            .setThumbnail(song.thumbnail)
            .addFields([{ name: "Requested by: ", value: `<@${song.initiator.id}>` },
            { name: "Author: ", value: `${song.author}` }])
            .setURL(song.url);
    }

    public helpMessage(guild: GuildManager): EmbedBuilder {
        const res = helpTemplate(this);
        res.addFields({
            name: 'Usage: ', value: `${guild.commandPrefix}${this.name}
                                            ${guild.commandPrefix}${this.name} <url>`
        });
        return res;
    }
}
