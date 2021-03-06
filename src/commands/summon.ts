import {BaseCommand, CommandException} from "./base-command";
import {CommandType} from "./command-type";
import {Message, MessageEmbed} from "discord.js";
import {GuildManager} from "../app/guild";
import {helpTemplate} from "../utils/utils";

export class SummonCommand extends BaseCommand {

    public alias: string[];

    public constructor() {
        super();
        this.alias = ['sm', 'join'];
    }

    public name(): CommandType {
        return CommandType.SUMMON;
    }

    public async run(msg: Message, guild: GuildManager, args?: string[]): Promise<void> {
        guild.checkMemberInChannel(msg.member);
        if (!guild.queueManager.activeConnection) {
            await guild.joinChannel(msg);
        } else{
            throw CommandException.UserPresentable(`I am already in the channel ${guild.queueManager.activeConnection.channel.name}!`);
        }
    }

    public helpMessage(guild: GuildManager): MessageEmbed {
        const res = helpTemplate(this.name());
        res.addField('Usage: ', `${guild.commandPrefix}${this.name()}`);
        return res;
    }
}