import {getLogger, Logger} from "../../utils/logger.js";
import {PlaylistDoc} from "../db/schemas/playlist.js";
import {SongDoc} from "../db/schemas/song.js";
import MongoDB from "../db/service.js";
import {User} from "discord.js";
import {CommandException} from "../../commands/base-command.js";

export class PlaylistDataSource {
    private static instance: PlaylistDataSource;
    public static getInstance(): PlaylistDataSource {
        if (!PlaylistDataSource.instance) {
            if (!MongoDB.isConnected()) {
                throw new Error('Mongo DB is not connected');
            }
            PlaylistDataSource.instance = new PlaylistDataSource();
        }
        return PlaylistDataSource.instance;
    }

    protected readonly logger: Logger;

    private constructor() {
        this.logger = getLogger('PlaylistDataSource');
    }

    public async get(creator: User, name?: string): Promise<PlaylistDoc> {
        this.logger.verbose(`Querying playlist ${name} by ${creator.username}`);
        return name ? MongoDB.Playlist.findOne({name: name, creator: creator.id}) : this.getDefault(creator);
    }

    private async getDefault(creator: User): Promise<PlaylistDoc> {
        this.logger.verbose(`Querying default playlist of ${creator.username}`);
        return MongoDB.Playlist.findOne({creator: creator.id, default: true});
    }

    public async getAll(creator: User): Promise<PlaylistDoc[]>{
        this.logger.verbose(`Querying all playlists by ${creator.username}`);
        return MongoDB.Playlist.find({creator: creator.id});
    }

    public async create(name: string, guildId: string, creator: User): Promise<PlaylistDoc> {
        this.logger.verbose(`Playlist ${name} created by ${creator.username}`);
        const count = (await this.getAll(creator)).length;
        return new MongoDB.Playlist({
            name: name,
            creator: creator.id,
            songs: [],
            guildId,
            default: (count < 1)
        }).save();
    }

    public async setDefault(creator: User, name: string): Promise<void> {
        this.logger.verbose(`Setting ${creator.username}'s default playlist to ${name}`);
        await MongoDB.Playlist.updateOne({creator: creator.id, default: true}, {default: false});
        await MongoDB.Playlist.updateOne({creator: creator.id, name: name}, {default: true});
    }

    public async delete(creator: User, name: string): Promise<void> {
        this.logger.verbose(`Deleting playlist ${name} by ${creator.username}`);
        await MongoDB.Playlist.deleteOne({name: name, creator: creator.id}).then((res): void => {
            if(res.deletedCount == 0) throw CommandException.UserPresentable(`Playlist *${name}* is not found!`);
        });
    }

    public async save(song: SongDoc, playlist: PlaylistDoc, creator: User): Promise<PlaylistDoc> {
        this.logger.verbose(`Saving song ${song.title} to playlist ${playlist.name}`);
        await MongoDB.Playlist.updateOne(
            {
                name: playlist.name,
                creator: creator.id
            },
            {
                $push: {'songs': song.id}
            });
        // returns the modified playlist
        return this.get(creator, playlist.name);
    }

    public async pull(song: SongDoc, playlist: PlaylistDoc, creator: User): Promise<PlaylistDoc> {
        this.logger.verbose(`Deleting song ${song.title} from playlist ${playlist.name}`);
        await MongoDB.Playlist.updateOne(
            {
                name: playlist.name,
                creator: creator.id
            },
            {
                $pull: {'songs': song.id}
            });
        // returns the modified playlist
        return this.get(creator, playlist.name);
    }
}
