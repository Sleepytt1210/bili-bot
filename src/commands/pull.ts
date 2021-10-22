import {BaseCommand, CommandException} from "./base-command";
import {CommandType} from "./command-type";
import {GuildManager} from "../app/guild";
import {Message, MessageEmbed, User} from "discord.js";
import {helpTemplate, isNum} from "../utils/utils";
import {PlaylistDoc} from "../data/db/schemas/playlist";

export class PullCommand extends BaseCommand {

    public alias: string[];

    public constructor() {
        super(['del']);
    }

    public name(): CommandType {
        return CommandType.PULL;
    }

    public async run(message: Message, guild: GuildManager, args?: string[]): Promise<void> {
        const cur = guild.currentPlaylist.get(message.author.id);
        if (args.length === 1 && isNum(args[0])) {
            const index = Number(args.shift());
            if (!cur) {
                throw CommandException.UserPresentable(`No playlist selected! Please do \`${guild.commandPrefix}playlists\` and \`${guild.commandPrefix}playlists list <name>/<index>\` first`);
            }
            if (cur.songs.length === 0) throw CommandException.UserPresentable(`Playlist *${cur.name}* is empty!`)
            if (index < 1 || index > cur.songs.length) throw CommandException.OutOfBound(cur.songs.length);
            await this.pull(guild, message.author, cur, (index - 1));
        } else if (args.length >= 1) {
            const name = args.join(" ");
            const songs = guild.currentShowlistResult.get(message.author.id);
            const doc = songs.find((song): boolean => song.title === name);
            if (!doc) throw CommandException.UserPresentable(`Song ${name} not found in playlist ${cur.name}!`);
            await this.pull(guild, message.author, cur, songs.indexOf(doc));
        } else {
            throw CommandException.UserPresentable(`Invalid argument! Please enter a name or index!`);
        }
    }

    private async pull(guild: GuildManager, user: User, playlist: PlaylistDoc, index: number): Promise<void> {
        const name = await guild.dataManager.deleteFromPlaylist(index, user, playlist);
        guild.printEvent(`${name} deleted from ${playlist.name}`);
    }

    public helpMessage(guild: GuildManager): MessageEmbed {
        const res = helpTemplate(this);
        res.addField('Usage: ', `${guild.commandPrefix}${this.name()} <name>/<index>`)
        return res;
    }
}
