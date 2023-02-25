import {BaseCommand} from "./base-command.js";
import {CommandType} from "./command-type.js";
import {Message, EmbedBuilder} from "discord.js";
import {GuildManager} from "../app/guild.js";
import {helpTemplate} from "../utils/utils.js";

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
        if (msg.member.voice.channelId == guild.guild.members.me.voice.channelId) {
            guild.printEvent(`I am already in the channel ${guild.guild.members.me.voice.channel.name}!`);
        }
    }

    public helpMessage(guild: GuildManager): EmbedBuilder {
        const res = helpTemplate(this);
        res.addFields({name: 'Usage: ', value: `${guild.commandPrefix}${this.name()}`});
        return res;
    }
}
