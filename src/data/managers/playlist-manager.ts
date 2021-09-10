import {GuildManager} from "../../app/guild";
import {getLogger, Logger} from "../../utils/logger";
import {BilibiliSong} from "../model/bilibili-song";
import {CommandException} from "../../commands/base-command";
import {User} from "discord.js";
import {SongDoc} from "../db/schemas/song";
import {SongDataSource} from "../datasources/song-datasource";
import {PlaylistDataSource} from "../datasources/playlist-datasource";
import {PlaylistDoc} from "../db/schemas/playlist";
import {SearchSongEntity} from "../datasources/bilibili-api";

export class PlaylistManager {
    protected readonly logger: Logger;
    private readonly guild: GuildManager;
    private readonly songDataSource: SongDataSource;
    private readonly playlistDataSource: PlaylistDataSource;

    public constructor(guild: GuildManager) {
        this.logger = getLogger(`GuildDataSource-${guild.id}`);
        this.guild = guild;
        this.songDataSource = SongDataSource.getInstance();
        this.playlistDataSource = PlaylistDataSource.getInstance();
    }

    public async saveToPlaylist(song: BilibiliSong | SearchSongEntity, initiator: User, listDoc: PlaylistDoc): Promise<void> {

        // Check if this song is already in playlist
        let songDoc = await this.songDataSource.getOne(song.uid);
        if (songDoc && listDoc.songs.includes(songDoc.id)) {
            throw CommandException.UserPresentable(`This song is already in playlist "${listDoc.name}"`);
        }

        // Otherwise insert the song if necessary and update playlist
        if (!songDoc) {
            songDoc = await this.songDataSource.insert(song);
        }

        if(!listDoc.songs.includes(songDoc.id)) {
            const updated = await this.playlistDataSource.save(songDoc, listDoc, initiator)
            if(this.guild.previousCommand !== "load") {
                this.guild.setCurrentPlaylist(updated, initiator.id);
                this.guild.setCurrentShowlistResult(await this.songDataSource.getFromPlaylist(listDoc), initiator.id);
            }
        }

        this.logger.info(`${songDoc.title} saved to ${listDoc.name}`);
    }

    public async deleteFromPlaylist(index: number, initiator: User, listDoc: PlaylistDoc): Promise<string> {

        // Check if this song is in playlist
        const id = await listDoc.songs[index];

        const songDoc = await this.songDataSource.getOne(null, id);

        this.guild.setCurrentPlaylist(await this.playlistDataSource.pull(songDoc, listDoc, initiator), initiator.id);
        this.guild.setCurrentShowlistResult(await this.songDataSource.getFromPlaylist(listDoc), initiator.id);
        this.logger.info(`${songDoc.title} deleted from ${listDoc.name}`);
        return songDoc.title;
    }

    public async loadFromPlaylist(initiator: User, playlist: PlaylistDoc): Promise<SongDoc[]> {

        // Check if playlist exist
        if(!playlist) {
            throw CommandException.UserPresentable(`Playlist "${playlist.name}" does not exist`);
        }

        // Get all songs
        const songs = await this.songDataSource.getFromPlaylist(playlist);

        this.logger.info(`Loaded songs from playlist ${playlist.name}`);
        return songs;
    }

    public async showPlayLists(initiator: User): Promise<PlaylistDoc[]>{
        const lists = await this.playlistDataSource.getAll(initiator);
        if(!lists) {
            throw CommandException.UserPresentable(`There is no playlist!`);
        }
        return lists;
    }
}
