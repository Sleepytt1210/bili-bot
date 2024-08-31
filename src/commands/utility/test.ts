import { BaseCommand } from "../base-command";
import { CommandType } from "../command-type";
import { Message, EmbedBuilder } from "discord.js";
import { GuildManager } from "../../app/guild";
import { helpTemplate } from "../../utils/utils";
import { BiliApiSessionDataSource } from "../data/datasources/bili-api-session-datasource.js";

export class TestCommand extends BaseCommand {

    public name: CommandType = CommandType.INFO;

    public constructor() {
        super(['tt']);
    }

    public async executeHandler(member: GuildMember, guild: GuildManager, args: Omit<CommandInteractionOptionResolver<CacheType>, "getMessage" | "getFocused">, interaction: ChatInputCommandInteraction): Promise<void> {
        if (message.author.id !== process.env.OWNER_USER_ID) {
            return;   
        }
        
        const bdts = BiliApiSessionDataSource.getInstance();
        const expired = await bdts.isExpired(1);
        guild.printEvent(String(expired));
    }

    public helpMessage(guild: GuildManager): EmbedBuilder {
        const res = helpTemplate(this);
        res.addFields({
            name: 'Usage: ', value: `${guild.commandPrefix}${this.name}`    
        });
        return res;
    }
}
