import {GuildManager} from "../app/guild";
import {Command, CommandException} from "./base-command";
import {Commands} from "./commands";
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
        const command = args.shift();
        if (this.commands.has(command)) {
            try {
                await this.commands.get(command).run(msg, this.guild, args)
            } catch (error) {
                this.logger.error(error);
                if (error instanceof CommandException && (error as CommandException).userPresentable) {
                    this.guild.printEvent(`${error}`);
                }
            }
        } else if (command.length > 0 && command.charCodeAt(0) >= 97 && command.charCodeAt(0) <= 122) {
            await msg.reply(`Invalid command ${command}`);
        }
    }
}
