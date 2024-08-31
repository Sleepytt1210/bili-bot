import {BaseCommand, SubCommand} from "../base-command";
import {CommandType} from "../command-type";
import {GuildManager} from "../../app/guild";
import {EmbedBuilder, CacheType, ChatInputCommandInteraction, CommandInteractionOptionResolver, GuildMember} from "discord.js";
import {helpTemplate} from "../../utils/utils";

export class ResumeCommand extends SubCommand {

    public constructor() {
        super(CommandType.RESUME, CommandType.QUEUE);
    }

    public name: CommandType = CommandType.RESUME;

    public async run(member: GuildMember, guild: GuildManager, _: {}, __: ChatInputCommandInteraction): Promise<void> {
        guild.checkMemberInChannel(member);
        if (guild.queueManager.resume()) {
            guild.printEvent(`Audio resumed`);
        }
    }
}
