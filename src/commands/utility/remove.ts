import {BaseCommand, CommandException, SubCommand} from "../base-command";
import {CommandType} from "../command-type";
import {GuildManager} from "../../app/guild";
import {EmbedBuilder, CacheType, ChatInputCommandInteraction, CommandInteractionOptionResolver, GuildMember} from "discord.js";
import {helpTemplate, isNum} from "../../utils/utils";

interface OptionType {
    index: number;
}
export class RemoveCommand extends SubCommand<OptionType> {

    public constructor() {
        super(CommandType.REMOVE, CommandType.QUEUE);
        this.addIntegerOption((option) => option.setName("index").setDescription("Index of song in the queue.").setRequired(true))
    }

    public async run(_: GuildMember, guild: GuildManager, args: OptionType, __: ChatInputCommandInteraction): Promise<void> {
        const index = args["index"];
        if (index) {
            const queue = guild.queueManager.queue;

            if (!queue || queue.length === 0) {
                throw CommandException.UserPresentable(`Queue is empty!`);
            }
            if (index < 1 || index > queue.length) throw CommandException.OutOfBound(queue.length);
            this.remove(guild, (index - 1));
        } else {
            throw CommandException.UserPresentable(`Index is required!`);
        }
    }

    private remove(guild: GuildManager, index: number): void {
        const name = guild.queueManager.removeSong(index);
        guild.printEvent(`${name.title} deleted from the queue`);
    }
}
