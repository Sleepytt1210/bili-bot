import {BaseCommand, CommandException} from "./base-command.js";
import {CommandType} from "./command-type.js";
import {GuildManager} from "../app/guild.js";
import {Message, EmbedBuilder} from "discord.js";
import {helpTemplate} from "../utils/utils.js";

export class StopCommand extends BaseCommand {

    public alias: string[];

    public constructor() {
        super(['s']);
    }

    public name(): CommandType {
        return CommandType.STOP;
    }

    public async run(message: Message, guild: GuildManager, _args?: string[]): Promise<void> {
        guild.checkMemberInChannel(message.member);
        if (!guild.queueManager.isPlaying) {
            throw CommandException.UserPresentable("I'm not playing!");
        } else {
            guild.queueManager.stop();
        }
    }

    public helpMessage(guild: GuildManager): EmbedBuilder {
        const res = helpTemplate(this);
        res.addFields({name: 'Usage: ', value: `${guild.commandPrefix}${this.name()}`});
        return res;
    }
}
