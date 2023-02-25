import {BaseCommand} from "./base-command.js";
import {CommandType} from "./command-type.js";
import {GuildManager} from "../app/guild.js";
import {Message, EmbedBuilder} from "discord.js";
import {helpTemplate} from "../utils/utils.js";

export class ResumeCommand extends BaseCommand {

    public alias: string[];

    public constructor() {
        super(['r', 'unpause', 'continue']);
    }

    public name(): CommandType {
        return CommandType.RESUME;
    }

    public async run(message: Message, guild: GuildManager, _args?: string[]): Promise<void> {
        guild.checkMemberInChannel(message.member);
        if (guild.queueManager.resume()) {
            guild.printEvent(`Audio resumed`);
        }
    }

    public helpMessage(guild: GuildManager): EmbedBuilder {
        const res = helpTemplate(this);
        res.addFields({name: 'Usage: ', value: `${guild.commandPrefix}${this.name()}`});
        return res;
    }
}
