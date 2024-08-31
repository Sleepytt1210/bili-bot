import {BaseCommand} from "../base-command";
import {CommandType} from "../command-type";
import {GuildManager} from "../../app/guild";
import {EmbedBuilder, CacheType, CommandInteractionOptionResolver, GuildMember} from "discord.js";
import {helpTemplate} from "../../utils/utils";

export class ShuffleCommand extends BaseCommand {


    public constructor() {
        super(['sh'], CommandType.SHUFFLE);
    }

    public name: CommandType = CommandType.SHUFFLE;

    public async executeHandler(member: GuildMember, guild: GuildManager, _?: Omit<CommandInteractionOptionResolver<CacheType>, "getMessage" | "getFocused">): Promise<void> {
        guild.checkMemberInChannel(member);
        if (!guild.queueManager.isPlaying) return;
        guild.queueManager.doShuffle();
        guild.printEvent('Queue shuffled');
    }

    public helpMessage(guild: GuildManager): EmbedBuilder {
        const res = helpTemplate(this);
        res.addFields({name: 'Usage: ', value: `${guild.commandPrefix}${this.name}`});
        return res;
    }
}
