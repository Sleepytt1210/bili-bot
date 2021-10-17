import {BaseCommand, CommandException} from "./base-command";
import {CommandType} from "./command-type";
import {GuildManager} from "../app/guild";
import {Message, MessageEmbed} from "discord.js";
import {helpTemplate, isNum} from "../utils/utils";


export class VolumeCommand extends BaseCommand {

    public alias: string[];

    public constructor() {
        super();
        this.alias = ['vol', 'sv', 'setvolume', 'v'];
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

    public helpMessage(guild: GuildManager): MessageEmbed {
        const res = helpTemplate(this);
        res.addField('Usage: ', `${guild.commandPrefix}${this.name()}
                                            ${guild.commandPrefix}${this.name()} \`0 ~ 100\``);
        return res;
    }
}
