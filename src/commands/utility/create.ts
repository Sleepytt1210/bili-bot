import {CommandException, SubCommand} from "../base-command";
import {CommandType} from "../command-type";
import {GuildManager} from "../../app/guild";
import {Message, EmbedBuilder} from "discord.js";
import {PlaylistDataSource} from "../data/datasources/playlist-datasource.js";
import {helpTemplate} from "../../utils/utils";
import {LoadCommand} from "./load.js";

export class CreateCommand extends SubCommand{

    public readonly parent: string;
    public name: CommandType = CommandType.CREATE;

    public constructor() {
        super(['cr','c'], CommandType.PLAYLISTS);
    }

    public getParent(): string {
        return this.parent;
    }

    public async executeHandler(member: GuildMember, guild: GuildManager, args: Omit<CommandInteractionOptionResolver<CacheType>, "getMessage" | "getFocused">, interaction: ChatInputCommandInteraction): Promise<void> {
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
        await PlaylistDataSource.getInstance().create(name, guild.id, message.author).then(async (playlist): Promise<void> => {
            await guild.setCurrentPlaylist(playlist, message.author.id);
            guild.printEvent(`Playlist *${name}* successfully created and selected!`);
        });
    }

    public helpMessage(guild: GuildManager): EmbedBuilder {
        const res = helpTemplate(this);
        res.addFields({name: 'Usage: ', value: `${guild.commandPrefix}${this.parent} ${this.name} <name>`});
        return res;
    }
}
