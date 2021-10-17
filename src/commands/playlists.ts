import {Message, MessageEmbed} from "discord.js";
import {BaseCommand, SubCommand} from "./base-command";
import {CommandType} from "./command-type";
import {GuildManager} from "../app/guild";
import {EmbedOptions, helpTemplate} from "../utils/utils";
import {ListCommand} from "./list";
import {CreateCommand} from "./create";
import {DeleteCommand} from "./delete";
import {SetDefaultPlaylistCommand} from "./setDefaultPlaylist";
import {getCommand} from "./commands";
import {PlaylistDoc} from "../data/db/schemas/playlist";


export class PlaylistsCommand extends BaseCommand {

    public alias: string[];
    private subcommands: Map<string, SubCommand>;

    public constructor() {
        super(['pl'])
        this.subcommands = new Map<string, SubCommand>([
            [CommandType.LIST, new ListCommand()],
            [CommandType.CREATE, new CreateCommand()],
            [CommandType.DELETE, new DeleteCommand()],
            [CommandType.SETDEFAULTPLAYLIST, new SetDefaultPlaylistCommand()]
        ]);
    }

    public name(): CommandType {
        return CommandType.PLAYLISTS;
    }

    public async run(message: Message, guild: GuildManager, args?: string[]): Promise<void> {

        if (args.length === 0) {
            await this.listAll(guild, message);
        } else {
            const subcommandName = args.shift();
            const subcommand = getCommand(subcommandName, this.subcommands);
            if (!subcommand) {
                guild.printEmbeds(this.helpMessage(guild, message));
            } else {
                await subcommand.run(message, guild, args);
            }
        }
    }

    private async listAll(guild: GuildManager, message: Message): Promise<void> {
        const playlists = await guild.dataManager.showPlayLists(message.author);

        const resultFunc = function (start): (playlist: PlaylistDoc, index: number) => string {
            return (playlist, index): string => {
                const name = (playlist.default) ? playlist.name + " 【Default】" : playlist.name;
                return `${start + index + 1}. ${name}`;
            };
        }

        const opt: EmbedOptions = {
            embedTitle: 'Your playlists: ',
            embedFooter: `${guild.commandPrefix}pl list <name> or <index> to check songs in list, ${guild.commandPrefix}load <name> or <index> to play the entire playlist`,
            start: 0,
            mapFunc: resultFunc,
            list: playlists
        }

        guild.printFlipPages(playlists, opt, message);

        guild.setPreviousCommand("playlists");
    }

    public helpMessage(guild: GuildManager, message: Message): MessageEmbed {
        const res = helpTemplate(this);
        let subs = '';
        const entries = this.subcommands.entries();
        for (const entry of entries) {
            subs += `**${entry[0]}** : ${entry[1].helpMessage(guild, message).fields[0].value}\n`;
        }
        const cur = guild.currentPlaylist.get(message.author.id);
        if (cur)
            res.addField('Current selected playlist: ', `${cur.name}`, true);
        res.addField('Usage: ', `${guild.commandPrefix}${this.name()} <subcommand>`, true)
            .addField('Subcommands: ', subs);
        return res;
    }
}
