import {BaseCommand, CommandException} from "./base-command";
import {CommandType} from "./command-type";
import {Message, MessageEmbed} from "discord.js";
import {GuildManager} from "../app/guild";
import {Commands, getCommand} from "./commands";

export class HelpCommand extends BaseCommand {

    public alias: string[];

    public constructor() {
        super(['h']);
    }

    public name(): CommandType {
        return CommandType.HELP;
    }

    public async run(msg: Message, guild: GuildManager, args?: string[]): Promise<void> {
        const dev = guild.guild.members.resolve("293762535675527168")
        if (args.length === 0) {
            const embed = new MessageEmbed().setTitle(`Bilibili Player (Modified by: ${dev.displayName})`)
                .setThumbnail(guild.guild.client.user.avatarURL())
                .addField(guild.guild.name, `\`\`\`properties\nPrefix: ${guild.commandPrefix}\n\`\`\``)
                .addField("Commands (Use help <command> for more detail)",
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
                    "\t``leave``: Leave the channel\n")
                .addField('Playlist Commands: ',
                    "\t``pl create``: Create a new playlist\n" +
                    "\t``pl delete``: Delete an existing playlist\n" +
                    "\t``pl setdpl``: Set a default playlist\n" +
                    "\t``pl list``: Select and show the info of a playlist\n" );
            guild.printEmbeds(embed);
            return;
        }
        const commandName = args[0];
        const command = getCommand(commandName, Commands);
        if (command) {
            try {
                const help = await command.helpMessage(guild, msg);
                msg.channel.send({embeds: [help]});
            } catch (error) {
                this.logger.error(error);
                if (error instanceof CommandException && (error as CommandException).userPresentable) {
                    throw CommandException.UserPresentable(`${error}`);
                }
            }
        } else {
            throw CommandException.UserPresentable(`Invalid command ${commandName}`);
        }
    }

    public helpMessage(guild: GuildManager): MessageEmbed {
        const res = new MessageEmbed();
        res.setTitle(this.name())
            .addField('Usage: ', `${guild.commandPrefix}${this.name()}`);
        return res;
    }
}
