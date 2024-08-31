import {BaseCommand, CommandException, SubCommand} from "../base-command";
import {CommandType} from "../command-type";
import {GuildManager} from "../../app/guild";
import {Message, EmbedBuilder, CacheType, ChatInputCommandInteraction, CommandInteractionOptionResolver, GuildMember} from "discord.js";
import {helpTemplate} from "../../utils/utils";

export class NextCommand<T> extends SubCommand<T> {

    public constructor() {
        super(CommandType.NEXT, CommandType.QUEUE);
    }

    public async run(member: GuildMember, guild: GuildManager, _: T, __: ChatInputCommandInteraction): Promise<void> {
        guild.checkMemberInChannel(member);
        if (guild.queueManager.isListEmpty()) {
            if (guild.queueManager.isPlaying()) {
                guild.queueManager.stop();
            } else throw CommandException.UserPresentable(`Queue is empty!`);
        } else {
            guild.queueManager.next();
        }
    }
}
