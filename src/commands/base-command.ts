import {getLogger, Logger} from "../utils/logger.js";
import {Message, EmbedBuilder} from "discord.js";
import {GuildManager} from "../app/guild.js";
import {CommandType} from "./command-type.js";

export interface Command {
    alias: string[];

    name(): CommandType;

    run(message: Message, guild: GuildManager, args?: string[]): Promise<void>;

    helpMessage(guild: GuildManager, message?: Message): EmbedBuilder;
}

export class BaseCommand implements Command {
    public alias: string[];
    public readonly logger: Logger;

    public constructor(alias: string[]) {
        this.logger = getLogger(`Command - ${this.name()}`);
        this.alias = alias;
    }

    public name(): CommandType {
        return CommandType.INVALID;
    }

    public run(_message: Message, _guild: GuildManager, _args?: string[]): Promise<void> {
        return;
    }

    public helpMessage(guild: GuildManager, message?: Message): EmbedBuilder {
        throw new Error('helpMessage() requires override');
    }
}

export class SubCommand extends BaseCommand {

    public parent: string;
    public alias: string[];

    public constructor(alias: string[], parent: string) {
        super(alias);
        this.parent = parent;
    }

    public name(): CommandType {
        return super.name();
    }

    public run(_message: Message, _guild: GuildManager, _args?: string[]): Promise<void> {
        return;
    }

    public helpMessage(guild: GuildManager, message?: Message): EmbedBuilder {
        throw new Error('helpMessage() requires override');
    }
}

export class CommandException {
    public userPresentable: boolean;
    public error: string | Error;
    public EmbedBuilder: EmbedBuilder;

    public constructor(userPresentable: boolean, error: string | Error, embed?: EmbedBuilder) {
        this.userPresentable = userPresentable;
        this.error = error;
        this.EmbedBuilder = embed;
    }

    public static UserPresentable(message: string, embed?: EmbedBuilder): CommandException {
        return new CommandException(true, message, embed);
    }

    public static OutOfBound(listLength: number): CommandException {
        return new CommandException(true, `Index out of bound! Please enter a number between \`${1}\` and \`${listLength}\`<:midfing:758322051085500446>`)
    }

    public static Internal(error: Error): CommandException {
        return new CommandException(false, error);
    }

    public toString(): string {
        return this.error.toString();
    }
}
