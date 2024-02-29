import {BaseCommand, CommandException} from "./base-command.js";
import {CommandType} from "./command-type.js";
import {GuildManager} from "../app/guild.js";
import {Message, EmbedBuilder} from "discord.js";
import {SongInfo} from "../data/model/song-info.js";
import {SongDataSource} from "../data/datasources/song-datasource.js";
import {helpTemplate, ytPlIdExtract} from "../utils/utils.js";
import {ytSearch} from "../data/datasources/bilibili-api.js";

export class PlayCommand extends BaseCommand {

    public alias: string[];
    public name: CommandType = CommandType.PLAY;

    public constructor() {
        super(['p']);
    }

    public async run(message: Message, guild: GuildManager, args?: string[]): Promise<void> {
        guild.checkMemberInChannel(message.member);
        if (args.length === 0) {
            throw CommandException.UserPresentable('', this.helpMessage(guild));
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

    public helpMessage(guild: GuildManager): EmbedBuilder {
        const res = helpTemplate(this);
        res.addFields({name: 'Usage: ', value: `${guild.commandPrefix}${this.name} <videourl>`});
        return res;
    }
}
