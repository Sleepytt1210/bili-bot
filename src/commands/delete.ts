import {CommandException, SubCommand} from "./base-command";
import {CommandType} from "./command-type";
import {GuildManager} from "../app/guild";
import {Message, MessageEmbed} from "discord.js";
import {PlaylistDataSource} from "../data/datasources/playlist-datasource";
import {helpTemplate, isNum} from "../utils/utils";
import {PlaylistsCommand} from "./playlists";
import {query} from "winston";

export class DeleteCommand extends SubCommand {

    public alias: string[];
    public readonly parent: string;

    public constructor() {
        super(['d', 'del'], CommandType.PLAYLISTS);
    }

    public name(): CommandType {
        return CommandType.DELETE;
    }

    public getParent(): string {
        return this.parent;
    }

    public async run(message: Message, guild: GuildManager, args: string[]): Promise<void> {
        const dts = PlaylistDataSource.getInstance();
        const creator = message.author;
        let name;
        if (args.length === 1 && isNum(args[0])) {
            name = PlaylistsCommand.getPlaylistFromIndex(guild, message, args[0]).name;
        } else {
            name = args.join(" ");
        }
        await dts.delete(creator, name).then((): void => {
            guild.printEvent(`Playlist *${name}* successfully deleted!`);
            if (name == guild.currentPlaylist.get(creator.id).name) guild.setCurrentPlaylist(null, creator.id);
        });

    }

    public helpMessage(guild: GuildManager): MessageEmbed {
        const res = helpTemplate(this);
        res.addField('Usage: ', `${guild.commandPrefix}${this.parent} ${this.name()} <name>/<index>`);
        return res;
    }
}
