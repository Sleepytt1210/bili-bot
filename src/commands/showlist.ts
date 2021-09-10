import {BaseCommand, CommandException} from "./base-command";
import {CommandType} from "./command-type";
import {GuildManager} from "../app/guild";
import {Message, MessageEmbed} from "discord.js";
import {helpTemplate, isNum} from "../utils/utils";
import {PlaylistDataSource} from "../data/datasources/playlist-datasource";
import {PlaylistDoc} from "../data/db/schemas/playlist";

export class ShowlistCommand extends BaseCommand {

    public alias: string[];

    public constructor() {
        super();
        this.alias = ['shw', 'show'];
    }

    public name(): CommandType {
        return CommandType.SHOWLIST;
    }

    public async run(message: Message, guild: GuildManager, args?: string[]): Promise<void> {
        let playlist: PlaylistDoc;
        const cur = guild.currentPlaylist.get(message.author.id)
        // Check argument to be index or name
        if(args.length === 1 && isNum(args[0])){
            const index = Number.parseInt(args.shift());
            const lists = await guild.dataManager.showPlayLists(message.author);
            if(!(index > 0 && index <= lists.length))
                throw CommandException.OutOfBound(lists.length);
            playlist = lists[index-1];
        }else if(args.length === 1 && args[0] === "current" || args[0] === "c"){
            if(cur) playlist = cur;
            else throw CommandException.UserPresentable(`There is no selected playlist currently!`)
        }else {
            const name = args.join(' ');
            playlist = await PlaylistDataSource.getInstance().get(message.author, name);
            if(!playlist) throw CommandException.UserPresentable(`Playlist ${name} does not exist!`);
        }
        guild.setCurrentPlaylist(playlist, message.author.id);
        guild.setPreviousCommand("showlist");

        const songs = await guild.dataManager.loadFromPlaylist(message.author, playlist);
        if (songs.length === 0) {
            throw CommandException.UserPresentable(`Playlist ${playlist.name} is empty`)
        }
        guild.setCurrentShowlistResult(songs, message.author.id);

        const generatedEmbed = (start): MessageEmbed => {
            const end = songs.length < 10 ? songs.length : start+10;
            const current = songs.slice(start, end);

            const embed = new MessageEmbed()
                .setTitle(`${playlist.name}:\nShowing ${start+1}-${end} out of ${songs.length}`)
                .setFooter(`Use ${guild.commandPrefix}select <index> to play a song`)
                .setColor(0x0ACDFF);
            const resultMessage = current.map((song, index): string => {
                return `${(start + index + 1)}. ${song.title}\n`;
            });
            embed.setDescription(resultMessage.toString());
            return embed;
        }

        guild.printFlipPages(songs, generatedEmbed, message);

        setTimeout(function (): void {
            guild.setPreviousCommand(null);
            guild.currentPlaylist.delete(message.author.id);
            guild.currentShowlistResult.delete(message.author.id);
        }, 300000);
    }

    public helpMessage(guild: GuildManager): MessageEmbed {
        const res = helpTemplate(this.name());
        const pref = guild.commandPrefix;
        res.addField('Usage: ', `${pref}${this.name()} <name>/<index>`)
            .addField('Following commands: ', `${pref}select <index> to play a song
                                                            ${pref}save <url> to save a song
                                                            ${pref}pull <name>/<index> to remove a song`);
        return res;
    }
}
