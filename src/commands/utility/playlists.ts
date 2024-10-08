import { Message, EmbedBuilder, APIEmbedField, User } from "discord.js";
import { BaseCommand, CommandException, SubCommand } from "../base-command";
import { CommandType } from "../command-type";
import { GuildManager } from "../../app/guild";
import { EmbedOptions, helpTemplate } from "../../utils/utils";
import { CreateCommand } from "./create.js";
import { DeleteCommand } from "./delete.js";
import { SetDefaultPlaylistCommand } from "./setDefaultPlaylist.js";
import { ListCommand } from "./list.js";
import { PlaylistDoc } from "../data/db/schemas/playlist.js";
import { getCommand } from "./commands.js";


export class PlaylistsCommand extends BaseCommand {

    public name: CommandType = CommandType.PLAYLISTS;
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

    public async executeHandler(member: GuildMember, guild: GuildManager, args: Omit<CommandInteractionOptionResolver<CacheType>, "getMessage" | "getFocused">, interaction: ChatInputCommandInteraction): Promise<void> {

        if (args.length === 0) {
            await this.listAll(guild, message);
        } else {
            const subcommandName = args.shift();
            const subcommand = getCommand(subcommandName, this.subcommands);
            if (!subcommand) {
                guild.printEmbeds((await this.helpMessage(guild, message)));
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
            embedFooter: {
                text: `${guild.commandPrefix}pl list <name> or <index> to check songs in list, 
            ${guild.commandPrefix}load <name> or <index> to play the entire playlist`
            },
            start: 0,
            mapFunc: resultFunc,
            list: playlists,
            ifEmpty: `It's empty here, use ${guild.commandPrefix}pl create <name> to create a new playlist!`
        }

        guild.printFlipPages(playlists, opt, message);
    }

    public async helpMessage(guild: GuildManager, message: Message): Promise<EmbedBuilder> {
        const res = helpTemplate(this);
        const subs: APIEmbedField[] = [];
        const pref = guild.commandPrefix + this.name;
        const entries = this.subcommands.entries();
        for (const entry of entries) {
            const field: APIEmbedField = { name: entry[0], value: `> ${(await entry[1].helpMessage(guild, message)).toJSON().fields[1].value}`, inline: true }
            subs.push(field);
        }
        const cur = await guild.getCurrentPlaylist(message.author.id);
        if (cur) {
            res.addFields({ name: 'Current selected playlist:', value: `${cur.name}` });
        }
        res.addFields({ name: 'Usage:', value: `${pref}` }, { name: 'Subcommands:', value: `${pref} <subcommand>` })
            .addFields(subs);
        return res;
    }

    public static async getPlaylistFromIndex(guild: GuildManager, user: User, index: number): Promise<PlaylistDoc> {
        const lists = await guild.dataManager.showPlayLists(user);
        if (!lists) throw CommandException.UserPresentable(`It's empty here, use ${guild.commandPrefix}pl create <name> to create a new playlist!`)
        if (index < 1 || index > lists.length) throw CommandException.OutOfBound(lists.length);
        return lists[index - 1];
    }
}
