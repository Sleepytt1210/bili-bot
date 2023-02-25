import {BaseCommand, CommandException} from "./base-command.js";
import {CommandType} from "./command-type.js";
import {Message, EmbedBuilder} from "discord.js";
import {GuildManager} from "../app/guild.js";
import {GuildDataSource} from "../data/datasources/guild-datasource.js";
import {helpTemplate} from "../utils/utils.js";

export class SetPrefixCommand extends BaseCommand {

    public alias: string[];

    public constructor() {
        super(['pr']);
    }

    public name(): CommandType {
        return CommandType.SETPREFIX;
    }

    public async run(message: Message, guild: GuildManager, args?: string[]): Promise<void> {
        if (args.length === 1) {
            await GuildDataSource.getInstance().updatePrefix(guild, args[0]);
            guild.printEvent(`Command prefix has been updated to \`${args[0]}\` by ${message.member.displayName}`);
        } else {
            throw CommandException.UserPresentable(`Invalid prefix`);
        }
    }

    public helpMessage(guild: GuildManager): EmbedBuilder {
        const res = helpTemplate(this);
        res.addFields({name: 'Usage: ', value: `${guild.commandPrefix}${this.name()} <new prefix>`});
        return res;
    }
}
