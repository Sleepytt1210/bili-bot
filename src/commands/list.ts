import {SubCommand} from "./base-command";
import {CommandType} from "./command-type";
import {GuildManager} from "../app/guild";
import {Message, MessageEmbed} from "discord.js";
import {EmbedOptions, helpTemplate} from "../utils/utils";
import {PlaylistDoc} from "../data/db/schemas/playlist";

export class ListCommand extends SubCommand {

    public alias: string[];
    public readonly parent: string;

    public constructor() {
        super();
        this.parent = CommandType.PLAYLISTS;
    }

    public name(): CommandType {
        return CommandType.LIST;
    }

    public getParent(): string {
        return this.parent;
    }

    public async run(message: Message, guild: GuildManager, args?: string[]): Promise<void> {
        const playlists = await guild.dataManager.showPlayLists(message.author);

        const resultFunc = function (start): (playlist: PlaylistDoc, index: number) => string {
            return (playlist, index): string => {
                const name = (playlist.default) ? playlist.name + " 【Default】" : playlist.name;
                return `${start + index + 1}. ${name}`;
            };
        }

        const opt: EmbedOptions = {
            embedTitle: 'Your playlists: ',
            embedFooter: `Use ${guild.commandPrefix}showlist <name> or <index> to check songs in list`,
            start: 0,
            mapFunc: resultFunc,
            list: playlists
        }

        guild.printFlipPages(playlists, opt, message);

        guild.setPreviousCommand("playlists");
    }

    public helpMessage(guild: GuildManager): MessageEmbed {
        const res = helpTemplate(this);
        res.addField('Usage: ', `${guild.commandPrefix}${this.parent} ${this.name()}`);
        return res;
    }
}
