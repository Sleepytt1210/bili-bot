import {BaseCommand} from "../base-command";
import {CommandType} from "../command-type";
import {GuildManager} from "../../app/guild";
import {Message, EmbedBuilder} from "discord.js";
import {helpTemplate} from "../../utils/utils";

export class LeaveCommand extends BaseCommand {

    public name: CommandType = CommandType.LEAVE;

    public constructor() {
        super(['quit', 'fuckoff', 'off', 'sayonara', 'bye', 'goaway', 'disconnect', 'dc']);
    }

    public async executeHandler(member: GuildMember, guild: GuildManager, args: Omit<CommandInteractionOptionResolver<CacheType>, "getMessage" | "getFocused">, interaction: ChatInputCommandInteraction): Promise<void> {
        guild.checkMemberInChannel(member);
        if (!guild.queueManager.activeConnection) return;
        guild.queueManager.stop();
        guild.queueManager.activeConnection.disconnect();
    }

    public helpMessage(guild: GuildManager): EmbedBuilder {
        const res = helpTemplate(this);
        res.addFields({name: 'Usage: ', value: `${guild.commandPrefix}${this.name}`});
        return res;
    }
}
