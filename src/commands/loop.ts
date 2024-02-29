import {BaseCommand} from "./base-command.js";
import {CommandType} from "./command-type.js";
import {GuildManager} from "../app/guild.js";
import {Message, EmbedBuilder} from "discord.js";
import {helpTemplate} from "../utils/utils.js";


export class LoopCommand extends BaseCommand {

    public name: CommandType = CommandType.LOOP;

    public constructor() {
        super([]);
    }

    public async run(message: Message, guild: GuildManager): Promise<void> {
        guild.checkMemberInChannel(message.member)
        guild.queueManager.isLoop = !guild.queueManager.isLoop;
        const onOff = (guild.queueManager.isLoop) ? "on" : "off";
        const embed = new EmbedBuilder()
            .setTitle(`Loop is turned ${onOff}!`);
        guild.printEmbeds(embed);
    }

    public helpMessage(guild: GuildManager): EmbedBuilder {
        const res = helpTemplate(this);
        res.addFields({name: 'Usage: ', value: `${guild.commandPrefix}${this.name}`});
        return res;
    }
}
