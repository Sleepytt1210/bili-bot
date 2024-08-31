import {BaseCommand, CommandException} from "../base-command";
import {CommandType} from "../command-type";
import {GuildManager} from "../../app/guild";
import {Message, EmbedBuilder} from "discord.js";
import {helpTemplate} from "../../utils/utils";

export class PromoteCommand extends BaseCommand {

    public name: CommandType = CommandType.PROMOTE;

    public constructor() {
        super(['pm']);
    }

    public async executeHandler(member: GuildMember, guild: GuildManager, args: Omit<CommandInteractionOptionResolver<CacheType>, "getMessage" | "getFocused">, interaction: ChatInputCommandInteraction): Promise<void> {
        guild.checkMemberInChannel(member);
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
        res.addFields({name: 'Usage: ', value: `${guild.commandPrefix}${this.name} <index>`});
        return res;
    }
}
