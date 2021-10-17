import {getLogger, Logger} from "../utils/logger";
import {Message, MessageEmbed} from "discord.js";
import {GuildManager} from "../app/guild";
import {CommandType} from "./command-type";

export interface Command {
    alias: string[];

    name(): CommandType;

    run(message: Message, guild: GuildManager, args?: string[]): Promise<void>;

    helpMessage(guild: GuildManager, message?: Message): MessageEmbed;
}

export class BaseCommand implements Command {
    public alias: string[];
    public readonly logger: Logger;

    public constructor() {
        this.logger = getLogger(`Command - ${this.name()}`);
    }

    public name(): CommandType {
        return CommandType.INVALID;
    }

    public run(_message: Message, _guild: GuildManager, _args?: string[]): Promise<void> {
        return;
    }

    public helpMessage(guild: GuildManager, message?: Message): MessageEmbed {
        throw new Error('helpMessage() requires override');
    }
}

export class SubCommand extends BaseCommand {

    public parent: string;
    public alias: string[];

    public constructor() {
        super();
    }

    public name(): CommandType {
        return super.name();
    }

    public run(_message: Message, _guild: GuildManager, _args?: string[]): Promise<void> {
        return;
    }

    public helpMessage(guild: GuildManager, message?: Message): MessageEmbed {
        throw new Error('helpMessage() requires override');
    }
}

export class CommandException {
    public userPresentable: boolean;
    public error: string | Error;

    public constructor(userPresentable: boolean, error: string | Error) {
        this.userPresentable = userPresentable;
        this.error = error;
    }

    public static UserPresentable(message: string): CommandException {
        return new CommandException(true, message);
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
