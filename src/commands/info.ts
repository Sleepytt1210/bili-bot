import {BaseCommand, CommandException} from "./base-command";
import {CommandType} from "./command-type";
import {Message, MessageEmbed} from "discord.js";
import {GuildManager} from "../app/guild";
import {helpTemplate} from "../utils/utils";
import {bvidExtract, toHms} from "../data/datasources/bilibili-api";
import * as ytdl from "ytdl-core";
import {BilibiliSong} from "../data/model/bilibili-song";

export class InfoCommand extends BaseCommand {

    public alias: string[];

    public constructor() {
        super();
        this.alias = ['i', 'np', 'nowplaying'];
    }

    public name(): CommandType {
        return CommandType.INFO;
    }

    public async run(message: Message, guild: GuildManager, args?: string[]): Promise<void> {
        if (args.length === 0) {
            await this.processResult(message, guild);
        }else if(args.length === 1) {
            const url = args.shift();
            if(ytdl.validateURL(url) || bvidExtract(url)) await this.processResult(message, guild, url);
            else throw CommandException.UserPresentable(`Invalid url ${url}`);
        }
    }

    private async processResult(message: Message, guild: GuildManager, url?: string): Promise<void> {
        const currentSong = (url) ? await BilibiliSong.withUrl(url, message.author) : guild.queueManager.currentSong;
        if (!currentSong && !guild.queueManager.currentSong) {
            throw CommandException.UserPresentable('No song is playing!');
        }
        this.logger.info(`Queried song: ${currentSong.title}`);
        const embed = await this.urlInfo(message, guild, currentSong);
        if(!url) {
            const streamTime = Math.floor(guild.queueManager.activeDispatcher.streamTime / 1000);
            const stHms = toHms(streamTime);
            const playTime = Math.floor((streamTime * 15) / (currentSong.rawDuration)) + 1;
            const emoji = (guild.queueManager.activeDispatcher.paused) ? "<a:Zawarudo:757243016615559270>" : "<a:Rainbow_Weeb:640863491229614080>";
            const show = [emoji + "  ", "▬", "▬", "▬", "▬", "▬", "▬", "▬", "▬", "▬", "▬", "▬", "▬", "▬", "▬", "▬"];
            show[playTime] = "<a:WoopWoop:640863532866469888>";
            show.push(" " + stHms + "/" + currentSong.hmsDuration);
            const showString = show.join("");
            embed.addField('Progress: ', showString)
        }else {
            embed.addField('Duration: ', currentSong.hmsDuration);
        }
        message.channel.send(embed);
    }

    private async urlInfo(message: Message, guild: GuildManager, song?: BilibiliSong): Promise<MessageEmbed> {
        return new MessageEmbed()
            .setTitle(song.title)
            .setTimestamp()
            .setThumbnail(song.thumbnail)
            .addField("Requested by: ", `<@${song.initiator.id}>`, true)
            .addField("Author: ", `${song.author}`, true)
            .setURL(song.url)
            .setColor(0x0ACDFF);
    }

    public helpMessage(guild: GuildManager): MessageEmbed {
        const res = helpTemplate(this.name());
        res.addField('Usage: ', `${guild.commandPrefix}${this.name()}
                                            ${guild.commandPrefix}${this.name()} <url>`);
        return res;
    }
}
