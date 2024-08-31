import {BaseCommand, CommandException} from "../base-command";
import {CommandType} from "../command-type";
import {GuildManager} from "../../app/guild";
import {Message, EmbedBuilder} from "discord.js";
import {helpTemplate} from "../../utils/utils";

export class NextCommand extends BaseCommand {

    public name: CommandType = CommandType.NEXT;

    public constructor() {
        super(['n', 'skip']);
    }

    public async executeHandler(member: GuildMember, guild: GuildManager, args: Omit<CommandInteractionOptionResolver<CacheType>, "getMessage" | "getFocused">, interaction: ChatInputCommandInteraction): Promise<void> {
        guild.checkMemberInChannel(member);
        if (guild.queueManager.isListEmpty()) {
            if (guild.queueManager.isPlaying()) {
                guild.queueManager.stop();
            } else throw CommandException.UserPresentable(`Queue is empty!`);
        } else {
            guild.queueManager.next();
        }
    }

    public helpMessage(guild: GuildManager): EmbedBuilder {
        const res = helpTemplate(this);
        res.addFields({name: 'Usage: ', value: `${guild.commandPrefix}${this.name}`});
        return res;
    }
}
