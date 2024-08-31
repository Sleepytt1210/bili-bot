import {BaseCommand, CommandException} from "../base-command";
import {CommandType} from "../command-type";
import {GuildManager} from "../../app/guild";
import {GuildMember, CacheType, CommandInteractionOptionResolver} from "discord.js";



export class VolumeCommand extends BaseCommand {

    public constructor() {
        super(['vol', 'sv', 'setvolume', 'v'], CommandType.VOLUME);
    }

    public name: CommandType = CommandType.VOLUME;

    public async executeHandler(_: GuildMember, guild: GuildManager, args: Omit<CommandInteractionOptionResolver<CacheType>, "getMessage" | "getFocused">): Promise<void> {
        const num = args.getInteger('volume');
        if (!num) guild.printEvent(`Current volume: ${guild.queueManager.volume * 100}%`);
        else if (num < 0 || num > 100) throw CommandException.UserPresentable(`Volume should be between 0 and 100!`);
        else {
            guild.queueManager.setVol(num / 100);
            guild.printEvent(`Current volume: ${guild.queueManager.volume * 100}%`);
        }
    }
}
