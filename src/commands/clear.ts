import {BaseCommand} from "./base-command";
import {CommandType} from "./command-type";
import {GuildManager} from "../app/guild";
import {Message, MessageEmbed} from "discord.js";
import {helpTemplate} from "../utils/utils";
import {Logger} from "../utils/logger";

export class ClearCommand extends BaseCommand {

    public alias: string[];
    public readonly logger: Logger;

    public constructor() {
        super();
        this.alias = ['c'];
    }

    public name(): CommandType {
        return CommandType.CLEAR;
    }

    public async run(message: Message, guild: GuildManager, _args?: string[]): Promise<void> {
        guild.checkMemberInChannel(message.member);
        if (!guild.queueManager.isPlaying) return;
        guild.queueManager.clear();
        guild.printEvent('Queue cleared!');
    }

    public helpMessage(guild: GuildManager): MessageEmbed {
        const res = helpTemplate(this.name());
        res.addField('Usage: ', `${guild.commandPrefix}${this.name()}`);
        return res;
    }
}
