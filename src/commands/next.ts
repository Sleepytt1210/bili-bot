import {BaseCommand, CommandException} from "./base-command";
import {CommandType} from "./command-type";
import {GuildManager} from "../app/guild";
import {Message, MessageEmbed} from "discord.js";
import {helpTemplate} from "../utils/utils";

export class NextCommand extends BaseCommand {

    public alias: string[];

    public constructor() {
        super();
        this.alias = ['n', 'skip'];
    }

    public name(): CommandType {
        return CommandType.NEXT;
    }

    public async run(message: Message, guild: GuildManager, _args?: string[]): Promise<void> {
        guild.checkMemberInChannel(message.member);
        if (guild.queueManager.isListEmpty()) {
            if(guild.queueManager.isPlaying) {
                guild.queueManager.stop();
            } else throw CommandException.UserPresentable(`Queue is empty!`);
        } else {
            guild.queueManager.next();
        }
    }

    public helpMessage(guild: GuildManager): MessageEmbed {
        const res = helpTemplate(this.name());
        res.addField('Usage: ', `${guild.commandPrefix}${this.name()}`);
        return res;
    }
}
