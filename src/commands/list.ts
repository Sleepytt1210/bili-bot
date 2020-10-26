import {SubCommand} from "./base-command";
import {CommandType} from "./command-type";
import {GuildManager} from "../app/guild";
import {Message, MessageEmbed, MessageReaction} from "discord.js";
import {helpTemplate} from "../utils/utils";

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
        const lists = await guild.dataManager.showPlayLists(message.author);

        const generatedEmbed = (start: number): MessageEmbed => {
            const end = lists.length < 10 ? lists.length : start + 10;
            const current = lists.slice(start, end);

            const embed = new MessageEmbed()
                .setTitle(`Your playlists: `)
                .setColor(0x0ACDFF)
                .setFooter(`Use ${guild.commandPrefix}showlist <name> or <index> to check songs in list`);
            const result = current.map((list, index): string => {
                const name = (list.default) ? list.name + " 【Default】" : list.name;
                return `${start + index + 1}.   ${name}`;
            });
            embed.setDescription(result);
            return embed;
        }

        guild.printFlipPages(lists, generatedEmbed, message);

        guild.setPreviousCommand("playlists");
    }

    public helpMessage(guild: GuildManager): MessageEmbed {
        const res = helpTemplate(this.name());
        res.addField('Usage: ', `${guild.commandPrefix}${this.parent} ${this.name()}`);
        return res;
    }
}