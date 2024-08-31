import {BaseCommand} from "../base-command";
import {CommandType} from "../command-type";
import {Message, EmbedBuilder} from "discord.js";
import {GuildManager} from "../../app/guild";
import {helpTemplate} from "../../utils/utils";

export class PauseCommand extends BaseCommand {

    public name: CommandType = CommandType.PAUSE;

    public constructor() {
        super(['pa']);
    }

    public async executeHandler(member: GuildMember, guild: GuildManager, args: Omit<CommandInteractionOptionResolver<CacheType>, "getMessage" | "getFocused">, interaction: ChatInputCommandInteraction): Promise<void> {
        guild.checkMemberInChannel(member);
        if (guild.queueManager.pause()) {
            guild.printEvent(`Audio paused`);
        }
    }

    public helpMessage(guild: GuildManager): EmbedBuilder {
        const res = helpTemplate(this);
        res.addFields({name: 'Usage: ', value: `${guild.commandPrefix}${this.name}`});
        return res;
    }
}
