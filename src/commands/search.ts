import {BaseCommand, CommandException} from "./base-command";
import {CommandType} from "./command-type";
import {GuildManager} from "../app/guild";
import {Message, MessageEmbed} from "discord.js";
import * as api from "../data/datasources/bilibili-api";
import {helpTemplate} from "../utils/utils";
import {XmlEntities} from 'html-entities';

const decoder = new XmlEntities();

export class SearchCommand extends BaseCommand {

    public alias: string[];

    public constructor() {
        super();
        this.alias = ['se'];
    }

    public name(): CommandType {
        return CommandType.SEARCH;
    }

    public async run(message: Message, guild: GuildManager, args?: string[]): Promise<void> {
        guild.checkMemberInChannel(message.member);
        if (args.length === 0) {
            throw CommandException.UserPresentable(this.helpMessage(guild).fields[0].value);
        }

        const keyword = args.join(" ");

        const entities = await api.search(keyword, 20);
        guild.setCurrentSearchResult(null);
        if (entities.length === 0) {
            throw CommandException.UserPresentable("No result found");
        } else {
            guild.setCurrentSearchResult(entities);
            const resultMessage = entities.map((entity, index): string => {
                return decoder.decode(`\`\`\`${index + 1}. ${entity.title} - ${entity.play} plays\`\`\``);
            });
            const embed = new MessageEmbed()
                .setTitle('Search result:')
                .setDescription(`${resultMessage.join("")}`)
                .setFooter(`Use ${guild.commandPrefix}select [number] to play a song`)
                .setColor(0x0ACDFF);
            await guild.activeTextChannel.send(embed);
            guild.setPreviousCommand("search");
        }
    }

    public helpMessage(guild: GuildManager): MessageEmbed {
        const res = helpTemplate(this.name());
        res.addField('Usage: ', `${guild.commandPrefix}${this.name()} <keyword>`);
        return res;
    }
}
