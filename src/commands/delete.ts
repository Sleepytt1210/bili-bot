import {CommandException, SubCommand} from "./base-command.js";
import {CommandType} from "./command-type.js";
import {GuildManager} from "../app/guild.js";
import {Message, EmbedBuilder} from "discord.js";
import {PlaylistDataSource} from "../data/datasources/playlist-datasource.js";
import {helpTemplate, isNum} from "../utils/utils.js";
import {PlaylistsCommand} from "./playlists.js";
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
            name = (await PlaylistsCommand.getPlaylistFromIndex(guild, message, args[0])).name;
        } else {
            name = args.join(" ");
        }
        await dts.delete(creator, name).then(async (): Promise<void> => {
            guild.printEvent(`Playlist *${name}* successfully deleted!`);
            if (name == (await guild.getCurrentPlaylist(creator.id)).name) await guild.setCurrentPlaylist(null, creator.id);
        });

    }

    public helpMessage(guild: GuildManager): EmbedBuilder {
        const res = helpTemplate(this);
        res.addFields({name: 'Usage: ', value: `${guild.commandPrefix}${this.parent} ${this.name()} <name>/<index>`});
        return res;
    }
}
