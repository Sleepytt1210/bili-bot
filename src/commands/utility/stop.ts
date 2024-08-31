import {BaseCommand, CommandException} from "../base-command";
import {CommandType} from "../command-type";
import {GuildManager} from "../../app/guild";
import {EmbedBuilder, GuildMember, CacheType, CommandInteractionOptionResolver} from "discord.js";
import {helpTemplate} from "../../utils/utils";

export class StopCommand extends BaseCommand {

    public constructor() {
        super(['s'], CommandType.STOP);
    }

    public name: CommandType = CommandType.STOP;

    public async executeHandler(member: GuildMember, guild: GuildManager, _?: Omit<CommandInteractionOptionResolver<CacheType>, "getMessage" | "getFocused">): Promise<void> {
        guild.checkMemberInChannel(member);
        if (!guild.queueManager.isPlaying()) {
            throw CommandException.UserPresentable("I'm not playing!");
        } else {
            guild.queueManager.stop();
        }
    }

    public helpMessage(guild: GuildManager): EmbedBuilder {
        const res = helpTemplate(this);
        res.addFields({name: 'Usage: ', value: `${guild.commandPrefix}${this.name}`});
        return res;
    }
}
