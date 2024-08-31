import {BaseCommand} from "../base-command";
import {CommandType} from "../command-type";
import {Message, EmbedBuilder, CacheType, CommandInteractionOptionResolver, GuildMember} from "discord.js";
import {GuildManager} from "../../app/guild";
import {helpTemplate} from "../../utils/utils";

export class SummonCommand extends BaseCommand {

    public constructor() {
        super(['sm', 'join', 'come', 'connect', 'cn', 'hopin'], CommandType.SUMMON);
    }

    public name: CommandType = CommandType.SUMMON;

    public async executeHandler(member: GuildMember, guild: GuildManager, _?: Omit<CommandInteractionOptionResolver<CacheType>, "getMessage" | "getFocused">): Promise<void> {
        guild.checkMemberInChannel(member, false);
        if (member.voice.channelId == guild.guild.members.me?.voice.channelId) {
            guild.printEvent(`I am already in the channel ${guild.guild.members.me?.voice.channel?.name}!`);
        }
    }
}
