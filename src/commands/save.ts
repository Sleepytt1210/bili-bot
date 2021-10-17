import {BaseCommand, CommandException} from "./base-command";
import {CommandType} from "./command-type";
import {GuildManager} from "../app/guild";
import {Message, MessageEmbed, User} from "discord.js";
import {helpTemplate, ytPlIdExtract} from "../utils/utils";
import {SongInfo} from "../data/model/song-info";
import {PlaylistDoc} from "../data/db/schemas/playlist";
import {bvidExtract} from "../data/datasources/bilibili-api";
import {LoadCommand} from "./load";

export class SaveCommand extends BaseCommand {

    public alias: string[];

    public constructor() {
        super(['add']);
    }

    public name(): CommandType {
        return CommandType.SAVE;
    }

    public async run(message: Message, guild: GuildManager, args?: string[]): Promise<void> {
        if (args.length === 1) {
            const query = args.shift();
            const cur = guild.currentPlaylist.get(message.author.id)
            if (!cur) {
                throw CommandException.UserPresentable(`No playlist selected! Please do \`${guild.commandPrefix}playlist\` or \`${guild.commandPrefix}showlist <name>/<index>\` first`);
            }
            const type = (query) ? ytPlIdExtract(query) ? '-y' : bvidExtract(query) ? '-b' : null : null;
            // If not a playlist
            if(!type) {
                const song = await SongInfo.withUrl(query, message.member);
                if(!song) throw CommandException.UserPresentable(`Invalid url ${query}, song cannot be found!`);
                await this.save(guild, message.author, song, cur);
            }else {
                // Save as a new playlist
                if (type === '-y') {
                    this.logger.info('Loading from YouTube playlist');
                    await LoadCommand.loadYouTubeList(message, guild, query, true, this.logger, cur.name);
                } else if (type === '-b') {
                    this.logger.info('Loading from BiliBili playlist');
                    await LoadCommand.loadBiliBiliList(message, guild, query, true, this.logger, cur.name);
                }
            }
        } else {
            throw CommandException.UserPresentable(`Invalid argument! Please enter a url!`);
        }
    }

    private async save(guild: GuildManager, user: User, song: SongInfo, cur: PlaylistDoc): Promise<void> {
        if (!song) {
            throw CommandException.UserPresentable('Invalid url!');
        }
        await guild.dataManager.saveToPlaylist(song, user, cur);
        guild.printEvent(`${song.title} saved to ${cur.name}`);
    }

    public helpMessage(guild: GuildManager): MessageEmbed {
        const res = helpTemplate(this);
        const pref = guild.commandPrefix + this.name()
        res.addField('Usage: ', `${pref} <url>
                    ${pref} <list-url> (To append a playlist into current selected playlist)`)
        return res;
    }
}
