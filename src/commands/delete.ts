import {CommandException, SubCommand} from "./base-command";
import {CommandType} from "./command-type";
import {GuildManager} from "../app/guild";
import {Message, MessageEmbed} from "discord.js";
import {PlaylistDataSource} from "../data/datasources/playlist-datasource";
import {helpTemplate, isNum} from "../utils/utils";

export class DeleteCommand extends SubCommand {

    public alias: string[];
    public readonly parent: string;

    public constructor() {
        super();
        this.parent = CommandType.PLAYLISTS;
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
            const lists = await guild.dataManager.showPlayLists(creator);
            const index = Number.parseInt(args[0]);
            if (index < 1 || index > lists.length) throw CommandException.OutOfBound(lists.length);
            name = lists[index - 1].name;
        } else {
            name = args.join(" ");
        }
        await dts.delete(creator, name).then((): void => {
            guild.printEvent(`Playlist ${name} successfully deleted!`);
            if (name == guild.currentPlaylist.get(creator.id).name) guild.setCurrentPlaylist(null, creator.id);
        });

    }

    public helpMessage(guild: GuildManager): MessageEmbed {
        const res = helpTemplate(this);
        res.addField('Usage: ', `${guild.commandPrefix}${this.parent} ${this.name()} <name>/<index>`);
        return res;
    }
}
