import {EmbedField, Message, MessageEmbed} from "discord.js";
import {BaseCommand, CommandException, SubCommand} from "./base-command";
import {CommandType} from "./command-type";
import {GuildManager} from "../app/guild";
import {EmbedOptions, helpTemplate} from "../utils/utils";
import {CreateCommand} from "./create";
import {DeleteCommand} from "./delete";
import {SetDefaultPlaylistCommand} from "./setDefaultPlaylist";
import {ListCommand} from "./list";
import {PlaylistDoc} from "../data/db/schemas/playlist";
import {getCommand} from "./commands";


export class PlaylistsCommand extends BaseCommand {

    public alias: string[];
    private readonly subcommands: Map<string, SubCommand>;

    public constructor() {
        super(['pl'])
        this.subcommands = new Map<string, SubCommand>([
            [CommandType.CREATE, new CreateCommand()],
            [CommandType.DELETE, new DeleteCommand()],
            [CommandType.SETDEFAULTPLAYLIST, new SetDefaultPlaylistCommand()],
            [CommandType.LIST, new ListCommand()]
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
        guild.setCurrentPlaylists(playlists, message.author.id);

        setTimeout(function (): void {
            guild.setPreviousCommand(null);
            guild.currentPlaylists.delete(message.author.id);
        }, 300000);
    }

    public helpMessage(guild: GuildManager, message: Message): MessageEmbed {
        const res = helpTemplate(this);
        const subs: EmbedField[] = [];
        const pref = guild.commandPrefix + this.name();
        const entries = this.subcommands.entries();
        for (const entry of entries) {
            const field: EmbedField = {name: entry[0], value: `> ${entry[1].helpMessage(guild, message).fields[1].value}`, inline: true}
            subs.push(field);
        }
        const cur = guild.currentPlaylist.get(message.author.id);
        if (cur) {
            res.addField('Current selected playlist:', `${cur.name}`);
        }
        res.addField('Usage:', `${pref}`)
            .addField('Subcommands:', `${pref} <subcommand>`)
            .addFields(subs);
        return res;
    }

    public static getPlaylistFromIndex(guild: GuildManager, message: Message, query: string): PlaylistDoc {
        const lists = guild.currentPlaylists.get(message.author.id);
        if (!lists) throw CommandException.UserPresentable(`Please use \`${guild.commandPrefix}playlist\` first!`)
        const index = Number.parseInt(query);
        if (index < 1 || index > lists.length) throw CommandException.OutOfBound(lists.length);
        return lists[index - 1];
    }
}
