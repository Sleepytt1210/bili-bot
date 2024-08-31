import {BaseCommand, CommandException} from "../base-command";
import {CommandType} from "../command-type";
import {Message, EmbedBuilder} from "discord.js";
import {GuildManager} from "../../app/guild";
import {GuildDataSource} from "../data/datasources/guild-datasource.js";
import {helpTemplate} from "../../utils/utils";

export class SetPrefixCommand extends BaseCommand {

    public name: CommandType = CommandType.SETPREFIX;

    public constructor() {
        super(['pr']);
    }

    public async executeHandler(member: GuildMember, guild: GuildManager, args: Omit<CommandInteractionOptionResolver<CacheType>, "getMessage" | "getFocused">, interaction: ChatInputCommandInteraction): Promise<void> {
        if (args.length === 1) {
            await GuildDataSource.getInstance().updatePrefix(guild, args[0]);
            guild.printEvent(`Command prefix has been updated to \`${args[0]}\` by ${member.displayName}`);
        } else {
            throw CommandException.UserPresentable(`Invalid prefix`);
        }
    }

    public helpMessage(guild: GuildManager): EmbedBuilder {
        const res = helpTemplate(this);
        res.addFields({name: 'Usage: ', value: `${guild.commandPrefix}${this.name} <new prefix>`});
        return res;
    }
}
