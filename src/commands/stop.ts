import {BaseCommand, CommandException} from "./base-command";
import {CommandType} from "./command-type";
import {GuildManager} from "../app/guild";
import {Message, MessageEmbed} from "discord.js";
import {helpTemplate} from "../utils/utils";

export class StopCommand extends BaseCommand {

    public alias: string[];

    public constructor() {
        super();
        this.alias = ['s'];
    }

    public name(): CommandType {
        return CommandType.STOP;
    }

    public async run(message: Message, guild: GuildManager, _args?: string[]): Promise<void> {
        guild.checkMemberInChannel(message.member);
        if (!guild.queueManager.isPlaying) {
            throw CommandException.UserPresentable("I'm not playing!");
        } else {
            guild.queueManager.stop();
        }
    }

    public helpMessage(guild: GuildManager): MessageEmbed {
        const res = helpTemplate(this);
        res.addField('Usage: ', `${guild.commandPrefix}${this.name()}`);
        return res;
    }
}
