import {BaseCommand, CommandException} from "../base-command";
import {CommandType} from "../command-type";
import {GuildManager} from "../../app/guild";
import {EmbedBuilder, CacheType, ChatInputCommandInteraction, CommandInteractionOptionResolver, GuildMember} from "discord.js";
import {helpTemplate, isNum} from "../../utils/utils";

export class RemoveCommand extends BaseCommand {

    public constructor() {
        super(['rm'], CommandType.REMOVE);
        this.addIntegerOption((option) => option.setName("index").setDescription("Index of song in the queue.").setRequired(true))
    }

    public async executeHandler(_: GuildMember, guild: GuildManager, args: Omit<CommandInteractionOptionResolver<CacheType>, "getMessage" | "getFocused">, interaction: ChatInputCommandInteraction): Promise<void> {
        const index = args.getInteger("index");
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
