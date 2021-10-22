import {BaseCommand, CommandException} from "./base-command";
import {CommandType} from "./command-type";
import {GuildManager} from "../app/guild";
import {Message, MessageEmbed, User} from "discord.js";
import {helpTemplate, ytPlIdExtract} from "../utils/utils";
import {SongInfo} from "../data/model/song-info";
import {PlaylistDoc} from "../data/db/schemas/playlist";
import {LoadCommand} from "./load";
import {bvidExtract} from "../data/datasources/bilibili-api";

export class SaveCommand extends BaseCommand {

    public alias: string[];

    public constructor() {
        super(['add']);
    }

    public name(): CommandType {
        return CommandType.SAVE;
    }

    public async run(message: Message, guild: GuildManager, args?: string[]): Promise<void> {

        const cur = guild.currentPlaylist.get(message.author.id);
        if (!cur) {
            throw CommandException.UserPresentable(`No playlist selected! Please do \`${guild.commandPrefix}playlist\` or \`${guild.commandPrefix}showlist <name>/<index>\` first`);
        }
        const query = args[0];
        if (args.length === 1) {
            // Save as a new playlist // If not a playlist
            const isCurSong = (query === 'c' || query === 'current');
            const song = isCurSong ? guild.queueManager.currentSong : await SongInfo.withUrl(query, message.member);
            if(!song) {
                throw CommandException.UserPresentable(`${isCurSong ? 'No song is playing!' : `Invalid url ${query}, song cannot be found!`}`);
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
            guild.printEmbeds(this.helpMessage(guild));
        }
    }

    private async save(guild: GuildManager, user: User, song: SongInfo, cur: PlaylistDoc): Promise<void> {
        if (!song) {
            throw CommandException.UserPresentable('Invalid url!');
        }
        await guild.dataManager.saveToPlaylist(song, user, cur);
        guild.printEvent(`**[${song.title}](${song.url})** saved to *${cur.name}*`);
    }

    public helpMessage(guild: GuildManager): MessageEmbed {
        const res = helpTemplate(this);
        const pref = guild.commandPrefix + this.name()
        res.addField('Usage: ', `${pref} <url>
                    ${pref} current/c (Save playing song into selected playlist)
                    ${pref} -list/-l <list-url> (Append a playlist into selected playlist)`)
        return res;
    }
}
