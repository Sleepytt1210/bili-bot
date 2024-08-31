import {GuildManager} from "../app/guild";
import {Command, CommandException} from "./base-command";
import {Commands, getCommand} from "./commands";
import {Message} from "discord.js";
import {getLogger, Logger} from "../utils/logger";

export class CommandEngine {
    protected guild: GuildManager;
    public commands: Map<string, Command>;
    protected logger: Logger;

    public constructor(guild: GuildManager) {
        this.guild = guild;
        this.commands = Commands;
        this.logger = getLogger('CommandEngine');
    }

    public async process(msg: Message, args: string[]): Promise<void> {
        const commandName = args.shift();
        const command = getCommand(commandName, this.commands)
        if (command) {
            try {
                await command.run(msg, this.guild, args)
            } catch (error) {
                this.logger.error(error);
                if (error instanceof CommandException && (error as CommandException).userPresentable) {
                    if(error.EmbedBuilder) this.guild.printEmbeds(error.EmbedBuilder);
                    else this.guild.printEvent(`${error}`);
                }
            }
        } else if (commandName.length > 0 && commandName.charCodeAt(0) >= 97 && commandName.charCodeAt(0) <= 122) {
            await msg.reply(`Invalid command ${commandName}`);
        }
    }
}
