import {getLogger, Logger} from "../utils/logger.js";
import {Message, EmbedBuilder} from "discord.js";
import {GuildManager} from "../app/guild.js";
import {CommandType} from "./command-type.js";

export interface Command {
    alias: string[];

    name: CommandType;

    run(message: Message, guild: GuildManager, args?: string[]): Promise<void>;

    helpMessage(guild: GuildManager, message?: Message): Promise<EmbedBuilder> | EmbedBuilder;
}

export abstract class BaseCommand implements Command {
    public alias: string[];
    public name: CommandType;
    public readonly logger: Logger;

    public constructor(alias: string[]) {
        this.logger = getLogger(`Command - ${this.name}`);
        this.alias = alias;
    }

    public abstract run(_message: Message, _guild: GuildManager, _args?: string[]): Promise<void>;

    public abstract helpMessage(guild: GuildManager, message?: Message): Promise<EmbedBuilder> | EmbedBuilder;
}

export abstract class SubCommand extends BaseCommand {

    public parent: string;
    public alias: string[];
    public name: CommandType;

    public constructor(alias: string[], parent: string) {
        super(alias);
        this.parent = parent;
    }

    abstract run(_message: Message, _guild: GuildManager, _args?: string[]): Promise<void>;

    abstract helpMessage(guild: GuildManager, message?: Message): Promise<EmbedBuilder> | EmbedBuilder;
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
