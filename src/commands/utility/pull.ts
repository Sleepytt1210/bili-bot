import {BaseCommand, CommandException} from "../base-command";
import {CommandType} from "../command-type";
import {GuildManager} from "../../app/guild";
import {Message, EmbedBuilder, User} from "discord.js";
import {helpTemplate, isNum} from "../../utils/utils";
import {PlaylistDoc} from "../data/db/schemas/playlist.js";
import { SongDoc } from "../data/db/schemas/song.js";

export class PullCommand extends BaseCommand {

    public name: CommandType = CommandType.PULL;

    public constructor() {
        super(['del']);
    }

    public async executeHandler(member: GuildMember, guild: GuildManager, args: Omit<CommandInteractionOptionResolver<CacheType>, "getMessage" | "getFocused">, interaction: ChatInputCommandInteraction): Promise<void> {
        const cur = await guild.getCurrentPlaylist(message.author.id);
        if (args.length === 1 && isNum(args[0])) {
            const index = Number(args.shift());
            if (!cur) {
                throw CommandException.UserPresentable(`No playlist selected! Please do \`${guild.commandPrefix}playlists\` and \`${guild.commandPrefix}playlists list <name>/<index>\` first`);
            }
            if (cur.songs.length === 0) throw CommandException.UserPresentable(`Playlist *${cur.name}* is empty!`)
            if (index < 1 || index > cur.songs.length) throw CommandException.OutOfBound(cur.songs.length);
            await this.pull(guild, message.author, cur, (index - 1));
        } else if (args.length >= 1) {
            const name = args.join(" ");

            // Populate playlist with songs
            const playlist = await (await guild.getCurrentPlaylist(message.author.id)).populate<{songs: SongDoc[]}>('songs');
            
            // Find the song of given name
            const doc = playlist.songs.find((song): boolean => song.title === name);
            
            // Throw error if not found
            if (!doc) throw CommandException.UserPresentable(`Song ${name} not found in playlist ${cur.name}!`);
            
            // Delete it
            await this.pull(guild, message.author, cur, playlist.songs.indexOf(doc));
        } else {
            throw CommandException.UserPresentable(`Invalid argument! Please enter a name or index!`);
        }
    }

    private async pull(guild: GuildManager, user: User, playlist: PlaylistDoc, index: number): Promise<void> {
        
        const name = await guild.dataManager.deleteFromPlaylist(index, user, playlist);
        guild.printEvent(`${name} deleted from ${playlist.name}`);
    }

    public helpMessage(guild: GuildManager): EmbedBuilder {
        const res = helpTemplate(this);
        res.addFields({name: 'Usage: ', value: `${guild.commandPrefix}${this.name} <name>/<index>`})
        return res;
    }
}
