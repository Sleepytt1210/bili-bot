import {BaseCommand} from "./base-command.js";
import {CommandType} from "./command-type.js";
import {Message, EmbedBuilder} from "discord.js";
import {GuildManager} from "../app/guild.js";
import {helpTemplate} from "../utils/utils.js";

export class PauseCommand extends BaseCommand {

    public alias: string[];
    public name: CommandType = CommandType.PAUSE;

    public constructor() {
        super(['pa']);
    }

    public async run(message: Message, guild: GuildManager, _args?: string[]): Promise<void> {
        guild.checkMemberInChannel(message.member);
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
