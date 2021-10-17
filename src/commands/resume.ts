import {BaseCommand} from "./base-command";
import {CommandType} from "./command-type";
import {GuildManager} from "../app/guild";
import {Message, MessageEmbed} from "discord.js";
import {helpTemplate} from "../utils/utils";

export class ResumeCommand extends BaseCommand {

    public alias: string[];

    public constructor() {
        super();
        this.alias = ['r'];
    }

    public name(): CommandType {
        return CommandType.RESUME;
    }

    public async run(message: Message, guild: GuildManager, _args?: string[]): Promise<void> {
        guild.checkMemberInChannel(message.member);
        if (guild.queueManager.resume()) {
            guild.printEvent(`Audio resumed`);
        }
    }

    public helpMessage(guild: GuildManager): MessageEmbed {
        const res = helpTemplate(this);
        res.addField('Usage: ', `${guild.commandPrefix}${this.name()}`);
        return res;
    }
}
