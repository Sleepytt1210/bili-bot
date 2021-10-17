import {CommandException, SubCommand} from "./base-command";
import {CommandType} from "./command-type";
import {GuildManager} from "../app/guild";
import {Message, MessageEmbed} from "discord.js";
import {PlaylistDataSource} from "../data/datasources/playlist-datasource";
import {helpTemplate, isNum} from "../utils/utils";

export class CreateCommand extends SubCommand {

    public alias: string[];
    public readonly parent: string;

    public constructor() {
        super();
        this.parent = CommandType.PLAYLISTS;
    }

    public name(): CommandType {
        return CommandType.CREATE;
    }

    public getParent(): string {
        return this.parent;
    }

    public async run(message: Message, guild: GuildManager, args?: string[]): Promise<void> {
        const name = args.join(" ");
        if (!name) throw CommandException.UserPresentable(`Please provide a name to the playlist!`);
        else if (isNum(name)) throw CommandException.UserPresentable(`Please do not use number as name!`)
        else if (name == "c" || name == "current") throw CommandException.UserPresentable(`**c** or **current** are reserved names!`)
        if (await PlaylistDataSource.getInstance().get(message.author, name))
            throw CommandException.UserPresentable(`Playlist ${name} already exists!`);
        await PlaylistDataSource.getInstance().create(name, guild.id, message.author).then((): void => {
            guild.printEvent(`Playlist ${name} successfully created!`);
        });
    }

    public helpMessage(guild: GuildManager): MessageEmbed {
        const res = helpTemplate(this);
        res.addField('Usage: ', `${guild.commandPrefix}${this.parent} ${this.name()} <name>`);
        return res;
    }
}
