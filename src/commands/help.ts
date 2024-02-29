import {BaseCommand, CommandException} from "./base-command.js";
import {CommandType} from "./command-type.js";
import {Message, EmbedBuilder} from "discord.js";
import {GuildManager} from "../app/guild.js";
import {Commands, getCommand} from "./commands.js";

export class HelpCommand extends BaseCommand {

    public alias: string[];
    public name: CommandType = CommandType.HELP;

    public constructor() {
        super(['h']);
    }

    public async run(msg: Message, guild: GuildManager, args?: string[]): Promise<void> {
        const dev = guild.guild.members.resolve("293762535675527168")
        if (args.length === 0) {
            const embed = new EmbedBuilder().setTitle(`Bilibili Player (Modified by: ${dev.displayName})`)
                .setThumbnail(guild.guild.client.user.avatarURL())
                .addFields({name: guild.guild.name, value: `\`\`\`properties\nPrefix: ${guild.commandPrefix}\n\`\`\``})
                .addFields({name: "Commands (Use help <command> for more detail)", value:
                    "\t``clear``: Clear the queue\n" +
                    "\t``help``: Show this help menu\n" +
                    "\t``info``: Show info of a song\n" +
                    "\t``load``: Load or play a playlist\n" +
                    "\t``loop``: Loop a song\n" +
                    "\t``next``: Skip a song\n" +
                    "\t``pause``: Pause the song\n" +
                    "\t``play``: Play a song\n" +
                    "\t``promote``: Move a song to the top queue\n" +
                    "\t``pull``: Remove a song from selected playlist\n" +
                    "\t``queue``: Show the queue\n" +
                    "\t``resume``: Resume from the pause\n" +
                    "\t``remove``: Remove a song from the queue\n" +
                    "\t``save``: Save a song to selected playlist\n" +
                    "\t``search``: Search bilibili video from keyword\n" +
                    "\t``select``: Select from a list\n" +
                    "\t``setprefix``: Change server prefix\n" +
                    "\t``shuffle``: To shuffle the queue\n" +
                    "\t``summon``: Summon the bot to your voice channel\n" +
                    "\t``stop``: Stop playing\n" +
                    "\t``volume``: Check and set volume\n" +
                    "\t``leave``: Leave the channel\n"})
                .addFields({name: 'Playlist Commands: ', value:
                    "\t``pl create``: Create a new playlist\n" +
                    "\t``pl delete``: Delete an existing playlist\n" +
                    "\t``pl setdpl``: Set a default playlist\n" +
                    "\t``pl list``: Select and show the info of a playlist\n"});
            guild.printEmbeds(embed);
            return;
        }
        const commandName = args[0];
        const command = getCommand(commandName, Commands);
        if (command) {
            const help = await command.helpMessage(guild, msg);
            guild.printEmbeds(help);
        } else {
            throw CommandException.UserPresentable(`Invalid command ${commandName}`);
        }
    }

    public helpMessage(guild: GuildManager): EmbedBuilder {
        const res = new EmbedBuilder();
        res.setTitle(this.name)
            .addFields({name: 'Usage: ', value: `${guild.commandPrefix}${this.name}`});
        return res;
    }
}
