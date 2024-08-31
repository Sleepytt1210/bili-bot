import {BaseCommand} from "../base-command";
import {CommandType} from "../command-type";
import {GuildManager} from "../../app/guild";
import {EmbedBuilder, CacheType, ChatInputCommandInteraction, CommandInteractionOptionResolver, GuildMember} from "discord.js";
import {helpTemplate} from "../../utils/utils";

export class ResumeCommand extends BaseCommand {


    public constructor() {
        super(['r', 'unpause', 'continue'], CommandType.RESUME);
    }

    public name: CommandType = CommandType.RESUME;

    public async executeHandler(member: GuildMember, guild: GuildManager, _: Omit<CommandInteractionOptionResolver<CacheType>, "getMessage" | "getFocused">, interaction: ChatInputCommandInteraction): Promise<void> {
        guild.checkMemberInChannel(member);
        if (guild.queueManager.resume()) {
            guild.printEvent(`Audio resumed`);
        }
    }
}
