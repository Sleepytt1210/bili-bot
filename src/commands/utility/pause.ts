import {SubCommand} from "../base-command";
import {CommandType} from "../command-type";
import {EmbedBuilder, ChatInputCommandInteraction, GuildMember} from "discord.js";
import {GuildManager} from "../../app/guild";
import {helpTemplate} from "../../utils/utils";

export class PauseCommand<T> extends SubCommand<T> {

    public constructor() {
        super(CommandType.PAUSE, CommandType.QUEUE);
    }

    public async run(member: GuildMember, guild: GuildManager, _: T, __: ChatInputCommandInteraction): Promise<void> {
        guild.checkMemberInChannel(member);
        if (guild.queueManager.pause()) {
            guild.printEvent(`Queue is paused`);
        }
    }
}
