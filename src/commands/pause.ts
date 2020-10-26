import {BaseCommand} from "./base-command";
import {CommandType} from "./command-type";
import {Message, MessageEmbed} from "discord.js";
import {GuildManager} from "../app/guild";
import {helpTemplate} from "../utils/utils";

export class PauseCommand extends BaseCommand {

    public alias: string[];

    public constructor() {
        super();
        this.alias = ['pa'];
    }

    public name(): CommandType {
        return CommandType.PAUSE;
    }

    public async run(message: Message, guild: GuildManager, _args?: string[]): Promise<void> {
        guild.checkMemberInChannel(message.member);
        if (guild.queueManager.pause()) {
            guild.printEvent(`Audio paused`);
        }
    }

    public helpMessage(guild: GuildManager): MessageEmbed {
        const res = helpTemplate(this.name());
        res.addField('Usage: ', `${guild.commandPrefix}${this.name()}`);
        return res;
    }
}
