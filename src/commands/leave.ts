import {BaseCommand} from "./base-command.js";
import {CommandType} from "./command-type.js";
import {GuildManager} from "../app/guild.js";
import {Message, EmbedBuilder} from "discord.js";
import {helpTemplate} from "../utils/utils.js";

export class LeaveCommand extends BaseCommand {

    public alias: string[];
    public name: CommandType = CommandType.LEAVE;

    public constructor() {
        super(['quit', 'fuckoff', 'off', 'sayonara', 'bye', 'goaway', 'disconnect', 'dc']);
    }

    public async run(message: Message, guild: GuildManager, _args?: string[]): Promise<void> {
        guild.checkMemberInChannel(message.member);
        if (!guild.queueManager.activeConnection) return;
        guild.queueManager.stop();
        guild.queueManager.activeConnection.disconnect();
    }

    public helpMessage(guild: GuildManager): EmbedBuilder {
        const res = helpTemplate(this);
        res.addFields({name: 'Usage: ', value: `${guild.commandPrefix}${this.name}`});
        return res;
    }
}
