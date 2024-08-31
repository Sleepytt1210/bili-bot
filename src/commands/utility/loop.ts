import {SubCommand} from "../base-command";
import {CommandType} from "../command-type";
import {GuildManager} from "../../app/guild";
import {EmbedBuilder, ChatInputCommandInteraction, GuildMember} from "discord.js";

interface OptionType {
    on?: boolean;
}
export class LoopCommand extends SubCommand<OptionType> {

    public constructor() {
        super(CommandType.LOOP, CommandType.QUEUE);
    }

    public async run(member: GuildMember, guild: GuildManager, option: OptionType, __: ChatInputCommandInteraction): Promise<void> {
        const on = option.on;
        guild.checkMemberInChannel(member)
        guild.queueManager.isLoop = on !== undefined ? on : !guild.queueManager.isLoop;
        const onOff = (guild.queueManager.isLoop) ? "on" : "off";
        const embed = new EmbedBuilder()
            .setTitle(`Loop is turned ${onOff}!`);
        guild.printEmbeds(embed);
    }
}
