import {BaseCommand} from "./base-command.js";
import {CommandType} from "./command-type.js";
import {GuildManager} from "../app/guild.js";
import {Message, EmbedBuilder} from "discord.js";
import {helpTemplate} from "../utils/utils.js";
import {Logger} from "winston";

export class ClearCommand extends BaseCommand {

    public alias: string[];
    public readonly logger: Logger;

    public constructor() {
        super(['c']);
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

    public helpMessage(guild: GuildManager): EmbedBuilder {
        const res = helpTemplate(this);
        res.addFields({name: 'Usage: ', value: `${guild.commandPrefix}${this.name()}`});
        return res;
    }
}
