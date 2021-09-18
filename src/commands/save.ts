import {BaseCommand, CommandException} from "./base-command";
import {CommandType} from "./command-type";
import {GuildManager} from "../app/guild";
import {Message, MessageEmbed, User} from "discord.js";
import {helpTemplate} from "../utils/utils";
import {SongInfo} from "../data/model/song-info";
import {PlaylistDoc} from "../data/db/schemas/playlist";

export class SaveCommand extends BaseCommand{

    public alias: string[];

    public constructor() {
        super();
        this.alias = ['add'];
    }

    public name(): CommandType {
        return CommandType.SAVE;
    }

    public async run(message: Message, guild: GuildManager, args?: string[]): Promise<void> {
        if (args.length === 1) {
            const song = await SongInfo.withUrl(args.shift(), message.member);
            const cur = guild.currentPlaylist.get(message.author.id)
            if(!cur){
                throw CommandException.UserPresentable(`No playlist selected! Please do \`${guild.commandPrefix}playlist\` or \`${guild.commandPrefix}showlist <name>/<index>\` first`);
            }
            await this.save(guild, message.author, song, cur);
        } else{
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
        const res = helpTemplate(this.name());
        res.addField('Usage: ', `${guild.commandPrefix}${this.name()} <url>\n`)
        return res;
    }
}
