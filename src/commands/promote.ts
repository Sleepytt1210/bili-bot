import {BaseCommand, CommandException} from "./base-command";
import {CommandType} from "./command-type";
import {GuildManager} from "../app/guild";
import {Message, MessageEmbed} from "discord.js";
import {helpTemplate} from "../utils/utils";

export class PromoteCommand extends BaseCommand {

    public alias: string[];

    public constructor() {
        super();
        this.alias = ['pm'];
    }

    public name(): CommandType {
        return CommandType.PROMOTE;
    }

    public async run(message: Message, guild: GuildManager, args?: string[]): Promise<void> {
        guild.checkMemberInChannel(message.member);
        if (args.length === 0) {
            throw CommandException.UserPresentable(this.helpMessage(guild).fields[0].value);
        }

        let index = parseInt(args.shift());
        if (!Number.isInteger(index)) {
            throw CommandException.UserPresentable(this.helpMessage(guild).fields[0].value);
        }
        index -= 1;

        const song = guild.queueManager.promoteSong(index);

        guild.printEvent(`${song.title} has been promoted to top of the playlist`);
    }

    public helpMessage(guild: GuildManager): MessageEmbed {
        const res = helpTemplate(this.name());
        res.addField('Usage: ', `${guild.commandPrefix}${this.name()} <index>`);
        return res;
    }
}
