import {BaseCommand} from "./base-command";
import {CommandType} from "./command-type";
import {GuildManager} from "../app/guild";
import {Message, MessageEmbed} from "discord.js";
import {helpTemplate} from "../utils/utils";

export class QueueCommand extends BaseCommand {

    public alias: string[];

    public constructor() {
        super();
        this.alias = ['q'];
    }

    public name(): CommandType {
        return CommandType.QUEUE;
    }

    public async run(message: Message, guild: GuildManager, _args?: string[]): Promise<void> {
        guild.checkMemberInChannel(message.member);
        if (guild.queueManager.isListEmpty()) {
            guild.printEvent(`Pending queue is empty`);
        } else {
            const list = guild.queueManager.queue;

            const generatedEmbed = start => {
                const end = list.length < 10 ? list.length : start + 10;
                const current = list.slice(start, end);

                const embed = new MessageEmbed()
                    .setTitle('Queue:')
                    .setColor(0x0ACDFF);
                const result = current.map((song, index) => {
                    return `${start + index + 1}.   ${song.title}\n`;
                });
                embed.setDescription(result.toString());
                return embed;
            }

            guild.printFlipPages(list, generatedEmbed, message);
        }
    }

    public helpMessage(guild: GuildManager): MessageEmbed {
        const res = helpTemplate(this.name());
        res.addField('Usage: ', `${guild.commandPrefix}${this.name()}`);
        return res;
    }
}
