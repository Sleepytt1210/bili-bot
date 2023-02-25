import {BaseCommand, CommandException} from "./base-command.js";
import {CommandType} from "./command-type.js";
import {GuildManager} from "../app/guild.js";
import {Message, EmbedBuilder} from "discord.js";
import {helpTemplate, isNum} from "../utils/utils.js";


export class VolumeCommand extends BaseCommand {

    public alias: string[];

    public constructor() {
        super(['vol', 'sv', 'setvolume', 'v']);
    }

    public name(): CommandType {
        return CommandType.VOLUME;
    }

    public async run(message: Message, guild: GuildManager, args?: string[]): Promise<void> {
        const num = args.shift();
        if (!num) guild.printEvent(`Current volume: ${guild.queueManager.volume * 100}%`);
        else if (args.length !== 0 || !isNum(num)) throw CommandException.UserPresentable(`Invalid input!`);
        else if (Number(num) < 0 || Number(num) > 100) throw CommandException.UserPresentable(`Volume should be between 0 and 100!`);
        else {
            guild.queueManager.setVol(Number(num) / 100);
            guild.printEvent(`Current volume: ${guild.queueManager.volume * 100}%`);
        }
    }

    public helpMessage(guild: GuildManager): EmbedBuilder {
        const res = helpTemplate(this);
        res.addFields({name: 'Usage: ', value: `${guild.commandPrefix}${this.name()}
                                            ${guild.commandPrefix}${this.name()} \`0 ~ 100\``});
        return res;
    }
}
