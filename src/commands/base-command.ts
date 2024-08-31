import { EmbedBuilder, SlashCommandBuilder, ChatInputCommandInteraction, GuildMember, APIInteractionGuildMember, CommandInteractionOptionResolver, CacheType, SlashCommandSubcommandBuilder} from "discord.js";
import {GuildManager} from "../app/guild.js";
import {CommandType} from "./command-type.js";
import { DiscordBot } from "app/discord-bot.js";
import { getLogger, Logger } from "utils/logger.js";

export abstract class BaseCommand extends SlashCommandBuilder {
    public alias: string[];
    protected logger: Logger;

    public constructor(alias: string[], name: CommandType) {
        super();
        this.alias = alias;
        this.setName(name);
        this.logger = getLogger(this.constructor.name);
    }

    public async execute(interaction: ChatInputCommandInteraction): Promise<void> {
        if (interaction.member && interaction.guildId) {
            if (!(interaction.member instanceof GuildMember)) {
                throw new CommandException(true, "Please interact with a \"real\" valid user!");
            }
            
            const bot = DiscordBot.getInstance()
            const guild = bot.findGuild(interaction.guildId);

            if (!guild) {
                throw new CommandException(true, "Bot is not registered to this guild!");
            }

            this.executeHandler(interaction.member, guild, interaction.options, interaction);
        } else {
            throw new CommandException(true, "Error retrieving guild or member info!");
        }

    }

    public abstract executeHandler(_member: GuildMember, _guild: GuildManager, _args: Omit<CommandInteractionOptionResolver<CacheType>, 'getMessage' | 'getFocused'>, interaction: ChatInputCommandInteraction): Promise<void>;
}

export abstract class SubCommand<OptionType = {}> extends SlashCommandSubcommandBuilder{

    public parent: CommandType;

    public constructor(name: CommandType, parent: CommandType) {
        super();
        this.parent = parent;
        this.setName(name);
    }

    abstract run(member: GuildMember, _guild: GuildManager, _args: OptionType, interaction: ChatInputCommandInteraction): Promise<void>;
}

export class CommandException {
    public userPresentable: boolean;
    public error: string | Error;
    public EmbedBuilder: EmbedBuilder | undefined;

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
