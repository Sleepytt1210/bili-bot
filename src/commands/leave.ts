import {BaseCommand} from "./base-command";
import {CommandType} from "./command-type";
import {GuildManager} from "../app/guild";
import {Message, MessageEmbed} from "discord.js";
import {helpTemplate} from "../utils/utils";

export class LeaveCommand extends BaseCommand {

    public alias: string[];

    public constructor() {
        super();
        this.alias = ['quit', 'fuckoff', 'off', 'sayonara', 'bye', 'goaway', 'disconnect', 'dc'];
    }

    public name(): CommandType {
        return CommandType.LEAVE;
    }

    public async run(message: Message, guild: GuildManager, _args?: string[]): Promise<void> {
        guild.checkMemberInChannel(message.member);
        if (!guild.queueManager.activeConnection) return;
        guild.queueManager.stop();
        await guild.queueManager.activeConnection.voice.setChannel(null);
    }

    public helpMessage(guild: GuildManager): MessageEmbed {
        const res = helpTemplate(this.name());
        res.addField('Usage: ', `${guild.commandPrefix}${this.name()}`);
        return res;
    }
}
