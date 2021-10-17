import {BaseCommand, CommandException} from "./base-command";
import {CommandType} from "./command-type";
import {GuildManager} from "../app/guild";
import {Message, MessageEmbed} from "discord.js";
import {SongInfo} from "../data/model/song-info";
import {SongDataSource} from "../data/datasources/song-datasource";
import {helpTemplate, ytPlIdExtract} from "../utils/utils";
import {ytSearch} from "../data/datasources/bilibili-api";

export class PlayCommand extends BaseCommand {

    public alias: string[];

    public constructor() {
        super();
        this.alias = ['p'];
    }

    public name(): CommandType {
        return CommandType.PLAY;
    }

    public async run(message: Message, guild: GuildManager, args?: string[]): Promise<void> {
        guild.checkMemberInChannel(message.member);
        if (args.length === 0) {
            throw CommandException.UserPresentable(this.helpMessage(guild).fields[0].value);
        }
        const query = args.join(" ");
        const url = args.shift();
        const plid = ytPlIdExtract(url);
        let song = await SongInfo.withUrl(url, message.member);
        if (!song) {
            if (plid) {
                await guild.commandEngine.commands.get('load').run(message, guild, [url]);
                return;
            } else {
                const url2 = await ytSearch(query);
                if (!url2) throw CommandException.UserPresentable(`No result found for \`${query}\`!`);
                song = await SongInfo.withUrl(url2, message.member);
            }
        }
        if (!song && !plid) throw CommandException.UserPresentable(`Failed to retrieve info from ${query}`);
        if (!await SongDataSource.getInstance().getOne(song.uid)) {
            await SongDataSource.getInstance().insert(song);
        }
        guild.queueManager.pushSong(song);
    }

    public helpMessage(guild: GuildManager): MessageEmbed {
        const res = helpTemplate(this);
        res.addField('Usage: ', `${guild.commandPrefix}${this.name()} <videourl>`);
        return res;
    }
}
