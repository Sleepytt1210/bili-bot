import {BaseCommand, CommandException} from "./base-command";
import {CommandType} from "./command-type";
import {GuildManager} from "../app/guild";
import {Message, MessageEmbed} from "discord.js";
import {SongInfo} from "../data/model/song-info";
import {helpTemplate} from "../utils/utils";
import {SongDataSource} from "../data/datasources/song-datasource";

export class SelectCommand extends BaseCommand {

    public alias: string[];

    public constructor() {
        super();
        this.alias = ['sl', 'sel'];
    }

    public name(): CommandType {
        return CommandType.SELECT;
    }

    public async run(message: Message, guild: GuildManager, args?: string[]): Promise<void> {
        guild.checkMemberInChannel(message.member);
        if (args.length === 0) {
            throw CommandException.UserPresentable(this.helpMessage(guild).fields[0].value);
        }
        let index = parseInt(args.shift());
        if (!Number.isInteger(index)) {
            throw CommandException.UserPresentable(this.helpMessage(guild).fields[0].value);
        }
        index--;

        if (!guild.previousCommand || (guild.previousCommand != "search" && guild.previousCommand != "showlist")) {
            throw CommandException.UserPresentable(`Invalid Operation: Please do \`${guild.commandPrefix}search\` or \`${guild.commandPrefix}showlist\` first`);
        }
        const searchBase = guild.previousCommand == "search" ? guild.currentSearchResult : guild.currentShowlistResult.get(message.author.id);
        if (searchBase.length === 0) throw CommandException.UserPresentable(`Result is empty! Nothing to select from!`);
        if (index < 0 || index >= searchBase.length) {
            throw CommandException.OutOfBound(searchBase.length);
        }
        const songdoc = searchBase[index];
        const song = await SongInfo.withUrl(songdoc.url, message.member);
        const sds = SongDataSource.getInstance();
        if (!(await sds.getOne(song.uid))) await sds.insert(song);
        guild.queueManager.pushSong(song);
    }

    public helpMessage(guild: GuildManager): MessageEmbed {
        const res = helpTemplate(this);
        res.addField('Usage: ', `${guild.commandPrefix}${this.name()} <index>`);
        return res;
    }
}
