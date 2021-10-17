import {CommandException, SubCommand} from "./base-command";
import {CommandType} from "./command-type";
import {GuildManager} from "../app/guild";
import {Message, MessageEmbed} from "discord.js";
import {EmbedOptions, helpTemplate, isNum} from "../utils/utils";
import {PlaylistDataSource} from "../data/datasources/playlist-datasource";
import {PlaylistDoc} from "../data/db/schemas/playlist";
import {SongDoc} from "../data/db/schemas/song";

export class ListCommand extends SubCommand {

    public alias: string[];
    public readonly parent: string;

    public constructor() {
        super(['shw', 'show'], CommandType.PLAYLISTS);
    }

    public name(): CommandType {
        return CommandType.LIST;
    }

    public async run(message: Message, guild: GuildManager, args?: string[]): Promise<void> {
        let playlist: PlaylistDoc;
        let switcher = 0;
        const cur = guild.currentPlaylist.get(message.author.id);
        // Check argument to be index or name
        if (args.length === 1 && isNum(args[0])) {
            const index = Number.parseInt(args.shift());
            const lists = await guild.dataManager.showPlayLists(message.author);
            if (!(index > 0 && index <= lists.length))
                throw CommandException.OutOfBound(lists.length);
            playlist = lists[index - 1];
        } else if ( (args.length === 0 || (args.length === 1 && args[0] === "current" || args[0] === "c")) && cur) {
            playlist = cur;
            switcher = 1;
        } else {
            const name = args.join(' ');
            switcher = 2;
            playlist = await PlaylistDataSource.getInstance().get(message.author, name);
            if (!playlist) throw CommandException.UserPresentable(`Playlist ${name} does not exist!`);
        }
        guild.setCurrentPlaylist(playlist, message.author.id);
        guild.setPreviousCommand("showlist");

        const songs = await guild.dataManager.loadFromPlaylist(message.author, playlist);
        if (songs.length === 0) {
            throw CommandException.UserPresentable(`Playlist ${playlist.name} is empty`)
        }
        guild.setCurrentShowlistResult(songs, message.author.id);

        const resultFunc = function (start): (song: SongDoc, index: number) => string {
            return (song, index): string => {
                return `${(start + index + 1)}. **[${song.title}](${song.url})**`;
            }
        };

        const opt: EmbedOptions = {
            embedTitle: `${switcher == 2 ? 'Showing default playlist - ' : (switcher == 1 ? 'Showing current playlist - ' : 'Showing playlist - ')}${playlist.name}:`,
            embedFooter: `Use ${guild.commandPrefix}select <index> to play a song, ~save <url> to save a song, ~pull <name>/<index> to remove a song`,
            list: songs,
            mapFunc: resultFunc,
            start: 0
        }

        guild.printFlipPages(songs, opt, message);

        setTimeout(function (): void {
            guild.setPreviousCommand(null);
            guild.currentPlaylist.delete(message.author.id);
            guild.currentShowlistResult.delete(message.author.id);
        }, 300000);
    }

    public helpMessage(guild: GuildManager): MessageEmbed {
        const res = helpTemplate(this);
        const pref = guild.commandPrefix;
        res.addField('Usage: ', `${pref}${this.parent} ${this.name()} <name>/<index>`)
            .addField('Following commands: ', `${pref}select <index> to play a song
                                                            ${pref}save <url> to save a song
                                                            ${pref}pull <name>/<index> to remove a song`);
        return res;
    }
}
