import {CommandException, SubCommand} from "./base-command";
import {CommandType} from "./command-type";
import {GuildManager} from "../app/guild";
import {Message, MessageEmbed} from "discord.js";
import {PlaylistDataSource} from "../data/datasources/playlist-datasource";
import {helpTemplate} from "../utils/utils";
import {LoadCommand} from "./load";

export class CreateCommand extends SubCommand{

    public alias: string[];
    public readonly parent: string;

    public constructor() {
        super(['cr','c'], CommandType.PLAYLISTS);
    }

    public name(): CommandType {
        return CommandType.CREATE;
    }

    public getParent(): string {
        return this.parent;
    }

    public async run(message: Message, guild: GuildManager, args?: string[]): Promise<void> {
        const name = args.join(" ");
        switch (LoadCommand.checkArg(name)) {
        case 0: {
            throw CommandException.UserPresentable(`Please provide a name to the playlist!`);
        }
        case 1: {
            throw CommandException.UserPresentable(`Please do not use playlist url as name!`);
        }
        case 2: {
            throw CommandException.UserPresentable(`Please do not use number as name!`);
        }
        }
        if(await PlaylistDataSource.getInstance().get(message.author, name))
            throw CommandException.UserPresentable(`Playlist *${name}* already exists!`);
        await PlaylistDataSource.getInstance().create(name, guild.id, message.author).then((playlist): void => {
            guild.setCurrentPlaylist(playlist, message.author.id);
            guild.printEvent(`Playlist *${name}* successfully created and selected!`);
        });
    }

    public helpMessage(guild: GuildManager): MessageEmbed {
        const res = helpTemplate(this);
        res.addField('Usage: ', `${guild.commandPrefix}${this.parent} ${this.name()} <name>`);
        return res;
    }
}
