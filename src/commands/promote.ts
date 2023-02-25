import {BaseCommand, CommandException} from "./base-command.js";
import {CommandType} from "./command-type.js";
import {GuildManager} from "../app/guild.js";
import {Message, EmbedBuilder} from "discord.js";
import {helpTemplate} from "../utils/utils.js";

export class PromoteCommand extends BaseCommand {

    public alias: string[];

    public constructor() {
        super(['pm']);
    }

    public name(): CommandType {
        return CommandType.PROMOTE;
    }

    public async run(message: Message, guild: GuildManager, args?: string[]): Promise<void> {
        guild.checkMemberInChannel(message.member);
        if (args.length === 0) {
            throw CommandException.UserPresentable('', this.helpMessage(guild))
        }

        let index = parseInt(args.shift());
        if (!Number.isInteger(index)) {
            throw CommandException.UserPresentable('', this.helpMessage(guild))
        }
        index--;

        const song = guild.queueManager.promoteSong(index);

        guild.printEvent(`${song.title} has been promoted to top of the playlist`);
    }

    public helpMessage(guild: GuildManager): EmbedBuilder {
        const res = helpTemplate(this);
        res.addFields({name: 'Usage: ', value: `${guild.commandPrefix}${this.name()} <index>`});
        return res;
    }
}
