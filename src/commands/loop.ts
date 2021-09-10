import {BaseCommand} from "./base-command";
import {CommandType} from "./command-type";
import {GuildManager} from "../app/guild";
import {Message, MessageEmbed} from "discord.js";
import {helpTemplate} from "../utils/utils";


export class LoopCommand extends BaseCommand {

    public name(): CommandType {
        return CommandType.LOOP;
    }

    public async run(message: Message, guild: GuildManager): Promise<void> {
        guild.checkMemberInChannel(message.member)
        guild.queueManager.isLoop = !guild.queueManager.isLoop;
        const onOff = (guild.queueManager.isLoop) ? "on" : "off";
        const embed = new MessageEmbed()
            .setTitle(`Loop is turned ${onOff}!`);
        guild.printEmbeds(embed);
    }

    public helpMessage(guild: GuildManager): MessageEmbed {
        const res = helpTemplate(this.name());
        res.addField('Usage: ', `${guild.commandPrefix}${this.name()}`);
        return res;
    }
}
