import {CommandException, SubCommand} from "../base-command";
import {CommandType} from "../command-type";
import {GuildManager} from "../../app/guild";
import {EmbedBuilder, GuildMember, ChatInputCommandInteraction} from "discord.js";
import {helpTemplate} from "../../utils/utils";

export class StopCommand<T> extends SubCommand<T> {

    public constructor() {
        super(CommandType.STOP, CommandType.QUEUE);
    }

    public async run(member: GuildMember, guild: GuildManager, _: T, __: ChatInputCommandInteraction): Promise<void> {
        guild.checkMemberInChannel(member);
        if (!guild.queueManager.isPlaying()) {
            throw CommandException.UserPresentable("I'm not playing!");
        } else {
            guild.queueManager.stop();
        }
    }
}
