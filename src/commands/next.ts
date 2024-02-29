import {BaseCommand, CommandException} from "./base-command.js";
import {CommandType} from "./command-type.js";
import {GuildManager} from "../app/guild.js";
import {Message, EmbedBuilder} from "discord.js";
import {helpTemplate} from "../utils/utils.js";

export class NextCommand extends BaseCommand {

    public alias: string[];
    public name: CommandType = CommandType.NEXT;

    public constructor() {
        super(['n', 'skip']);
    }

    public async run(message: Message, guild: GuildManager, _args?: string[]): Promise<void> {
        guild.checkMemberInChannel(message.member);
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
