import {BaseCommand, CommandException} from "./base-command";
import {CommandType} from "./command-type";
import {GuildManager} from "../app/guild";
import {Message, MessageEmbed} from "discord.js";
import {helpTemplate, isNum} from "../utils/utils";

export class RemoveCommand extends BaseCommand {

    public alias: string[];

    public constructor() {
        super(['rm']);
    }

    public name(): CommandType {
        return CommandType.REMOVE;
    }

    public async run(message: Message, guild: GuildManager, args?: string[]): Promise<void> {
        const queue = guild.queueManager.queue;
        if (args.length === 1 && isNum(args[0])) {
            const index = Number(args.shift());
            if (!queue || queue.length === 0) {
                throw CommandException.UserPresentable(`Queue is empty!`);
            }
            if (index < 1 || index > queue.length) throw CommandException.OutOfBound(queue.length);
            await this.remove(guild, (index - 1));
        } else {
            throw CommandException.UserPresentable(`Invalid argument! Please enter a number!`);
        }
    }

    private async remove(guild: GuildManager, index: number): Promise<void> {
        const name = await guild.queueManager.removeSong(index);
        guild.printEvent(`${name.title} deleted from the queue`);
    }

    public helpMessage(guild: GuildManager): MessageEmbed {
        const res = helpTemplate(this);
        res.addField('Usage: ', `${guild.commandPrefix}${this.name()} <index>`)
        return res;
    }
}
