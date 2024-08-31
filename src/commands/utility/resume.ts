import {BaseCommand} from "../base-command";
import {CommandType} from "../command-type";
import {GuildManager} from "../../app/guild";
import {Message, EmbedBuilder} from "discord.js";
import {helpTemplate} from "../../utils/utils";

export class ResumeCommand extends BaseCommand {


    public constructor() {
        super(['r', 'unpause', 'continue']);
    }

    public name: CommandType = CommandType.RESUME;

    public async executeHandler(member: GuildMember, guild: GuildManager, args: Omit<CommandInteractionOptionResolver<CacheType>, "getMessage" | "getFocused">, interaction: ChatInputCommandInteraction): Promise<void> {
        guild.checkMemberInChannel(member);
        if (guild.queueManager.resume()) {
            guild.printEvent(`Audio resumed`);
        }
    }

    public helpMessage(guild: GuildManager): EmbedBuilder {
        const res = helpTemplate(this);
        res.addFields({name: 'Usage: ', value: `${guild.commandPrefix}${this.name}`});
        return res;
    }
}
