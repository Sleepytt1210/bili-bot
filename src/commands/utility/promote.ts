import {CommandException, SubCommand} from "../base-command";
import {CommandType} from "../command-type";
import {GuildManager} from "../../app/guild";
import {EmbedBuilder, CacheType, ChatInputCommandInteraction, CommandInteractionOptionResolver, GuildMember} from "discord.js";
import {helpTemplate} from "../../utils/utils";

interface OptionType {
    index: number;
}

export class PromoteCommand extends SubCommand<OptionType> {

    public constructor() {
        super(CommandType.PROMOTE, CommandType.QUEUE);
    }

    public async run(member: GuildMember, guild: GuildManager, args: OptionType, interaction: ChatInputCommandInteraction): Promise<void> {
        guild.checkMemberInChannel(member);
        const index = args.index;
        if (index) {
            throw CommandException.UserPresentable('Please specify an index!')
        }

        const song = guild.queueManager.promoteSong(index-1);

        guild.printEvent(`${song.title} has been promoted to top of the playlist`);
    }
}
