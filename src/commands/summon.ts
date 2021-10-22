import {BaseCommand, CommandException} from "./base-command";
import {CommandType} from "./command-type";
import {Message, MessageEmbed} from "discord.js";
import {GuildManager} from "../app/guild";
import {helpTemplate} from "../utils/utils";

export class SummonCommand extends BaseCommand {

    public alias: string[];

    public constructor() {
        super(['sm', 'join', 'come', 'connect', 'cn', 'hopin']);
    }

    public name(): CommandType {
        return CommandType.SUMMON;
    }

    public async run(msg: Message, guild: GuildManager, args?: string[]): Promise<void> {
        guild.checkMemberInChannel(msg.member, false);
        if (guild.queueManager.activeConnection) {
            throw CommandException.UserPresentable(`I am already in the channel ${guild.guild.me.voice.channel.name}!`);
        }
    }

    public helpMessage(guild: GuildManager): MessageEmbed {
        const res = helpTemplate(this);
        res.addField('Usage: ', `${guild.commandPrefix}${this.name()}`);
        return res;
    }
}
