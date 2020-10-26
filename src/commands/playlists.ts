import {Message, MessageEmbed} from "discord.js";
import {BaseCommand, SubCommand} from "./base-command";
import {CommandType} from "./command-type";
import {GuildManager} from "../app/guild";
import {helpTemplate} from "../utils/utils";
import {ListCommand} from "./list";
import {CreateCommand} from "./create";
import {DeleteCommand} from "./delete";
import {SetDefaultPlaylistCommand} from "./setDefaultPlaylist";


export class PlaylistsCommand extends BaseCommand {

    public alias: string[];
    private subcommands: Map<string, SubCommand>;

    public constructor() {
        super()
        this.alias = ['pl'];
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

        if(args.length === 0) {
            await message.reply(this.helpMessage(guild, message));
        }else{
            const subcommand = args.shift();
            if(!this.subcommands.has(subcommand)) {
                await guild.activeTextChannel.send(this.helpMessage(guild, message));
            }else{
                await this.subcommands.get(subcommand).run(message, guild, args);
            }
        }
    }

    public helpMessage(guild: GuildManager, message: Message): MessageEmbed {
        const res = helpTemplate(this.name());
        let subs = String();
        const entries = this.subcommands.entries();
        for(const entry of entries){
            subs += `**${entry[0]}** : ${entry[1].helpMessage(guild).fields[0].value}\n`;
        }
        const cur = guild.currentPlaylist.get(message.author.id);
        if (cur)
            res.addField('Current selected playlist: ', `${cur.name}`, true);
        res.addField('Usage: ', `${guild.commandPrefix}${this.name()} <subcommand>`, true)
            .addField('Subcommands: ', subs);
        return res;
    }
}