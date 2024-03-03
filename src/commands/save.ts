import {BaseCommand, CommandException} from "./base-command.js";
import {CommandType} from "./command-type.js";
import {GuildManager} from "../app/guild.js";
import {Message, EmbedBuilder, User} from "discord.js";
import {helpTemplate, isNum, ytPlIdExtract} from "../utils/utils.js";
import {SongInfo} from "../data/model/song-info.js";
import {PlaylistDoc} from "../data/db/schemas/playlist.js";
import {LoadCommand} from "./load.js";
import {BiliSongEntity, bvidExtract} from "../data/datasources/bilibili-api.js";

export class SaveCommand extends BaseCommand {

    public alias: string[];

    public constructor() {
        super(['add']);
    }

    public name: CommandType = CommandType.SAVE;

    public async run(message: Message, guild: GuildManager, args?: string[]): Promise<void> {

        const cur = await guild.getCurrentPlaylist(message.author.id);
        if (!cur) {
            throw CommandException.UserPresentable(`No playlist selected! Please do \`${guild.commandPrefix}playlist\` or \`${guild.commandPrefix}playlist list <name>/<index>\` first`);
        }
        const query = args[0];
        if (args.length === 1) {
            // Save as a new playlist // If not a playlist
            const isCurSong = (query === 'c' || query === 'current');
            var song: SongInfo; 
            var errMsg = "";
            if (query === 'c' || query === 'current') {
                song = guild.queueManager.currentSong
                errMsg = "No song is playing!"
            } else if (isNum(query)) {
                const index = Number(query);
                const list = await guild.getCurrentSearchResult(message.author.id);

                if (!list || list.length === 0) throw CommandException.UserPresentable('Search result timed out or does not exist. Please do a search first!')

                if (index < 1 || index > list.length) throw CommandException.OutOfBound(list.length).error.toString();
                song = await SongInfo.withUrl(list[index - 1].url, message.member);
                errMsg = `Invalid index '${query}'!`
            } else {
                song = await SongInfo.withUrl(query, message.member);
                errMsg = `Invalid url ${query}, song cannot be found!`
            }

            if(!song) {
                throw CommandException.UserPresentable(errMsg);
            }
            await this.save(guild, message.author, song, cur);
        } else if (args.length === 2) {
            const arg = query;
            if(arg !== '-list' && arg !== '-l') {
                throw CommandException.UserPresentable('Only arguments -list or -l are accepted!');
            }
            const url = args[1];
            const type = ytPlIdExtract(url) ? 'y' : (bvidExtract(url) ? 'b' : null);
            if(type == 'y') {
                this.logger.info('Loading from YouTube playlist');
                await LoadCommand.loadYouTubeList(message, guild, url, true, this.logger, cur);
            }else if(type == 'b') {
                this.logger.info('Loading from BiliBili playlist');
                await LoadCommand.loadBiliBiliList(message, guild, url, true, this.logger, cur);
            }else {
                throw CommandException.UserPresentable('Invalid url!');
            }
        } else {
            throw CommandException.UserPresentable('', this.helpMessage(guild));
        }
    }

    private async save(guild: GuildManager, user: User, song: SongInfo | BiliSongEntity, cur: PlaylistDoc): Promise<void> {
        if (!song) {
            throw CommandException.UserPresentable('Invalid url!');
        }
        await guild.dataManager.saveToPlaylist(song, user, cur);
        guild.printEvent(`**[${song.title}](${song.url})** saved to *${cur.name}*`);
    }

    public helpMessage(guild: GuildManager): EmbedBuilder {
        const res = helpTemplate(this);
        const pref = guild.commandPrefix + this.name
        res.addFields({name: 'Usage: ', value: `${pref} <url>
                    ${pref} current/c (Save playing song into selected playlist)
                    ${pref} <index> (Save song from search list)
                    ${pref} -list/-l <list-url> (Append a playlist into selected playlist)`})
        return res;
    }
}
