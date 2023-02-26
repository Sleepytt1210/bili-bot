import {getLogger, Logger} from "../../utils/logger.js";
import {SongDoc} from "../db/schemas/song.js";
import {PlaylistDoc} from "../db/schemas/playlist.js";
import {SongInfo} from "../model/song-info.js";
import MongoDB from "../db/service.js";
import {BiliSongEntity} from "./bilibili-api.js";
import {Schema} from "mongoose";

export class SongDataSource {
    private static instance: SongDataSource;
    public static getInstance(): SongDataSource {
        if (!SongDataSource.instance) {
            if (!MongoDB.isConnected()) {
                throw new Error('Mongo DB is not connected');
            }
            SongDataSource.instance = new SongDataSource();
        }
        return SongDataSource.instance;
    }

    protected readonly logger: Logger;

    private constructor() {
        this.logger = getLogger('SongDataSource');
    }

    public async getOne(uid?: string, _id?: Schema.Types.ObjectId): Promise<SongDoc> {
        this.logger.verbose(`Querying song with id=${uid}`);
        return (uid) ? MongoDB.Song.findOne({uid: uid}) : MongoDB.Song.findOne({_id: _id});
    }

    public async getByUrl(url?: string, _id?: Schema.Types.ObjectId): Promise<SongDoc> {
        this.logger.verbose(`Querying song with url=${url}`);
        return (url) ? MongoDB.Song.findOne({url: url}) : MongoDB.Song.findOne({_id: _id});
    }

    public async getFromPlaylist(playlist: PlaylistDoc): Promise<SongDoc[]> {
        this.logger.verbose(`Querying songs from playlist ${playlist.name} in ${playlist.guildId}`);
        const cursor = MongoDB.Song.find({
            '_id': {$in: playlist.songs}
        }).cursor();
        const result: SongDoc[] = [];
        for (let song = await cursor.next(); song; song = await cursor.next()) {
            result.push(song);
        }
        return result;
    }

    public async insert(song: SongInfo | SongDoc | BiliSongEntity): Promise<SongDoc> {
        this.logger.verbose(`Saving song ${song.uid}`);
        if (song instanceof SongInfo || song instanceof BiliSongEntity) {
            return new MongoDB.Song({
                uid: song.uid,
                url: song.url,
                title: song.title,
                author: song.author,
                hmsDuration: song.hmsDuration,
                rawDuration: song.rawDuration,
                description: song.description,
                ext: song.format,
                thumbnail: song.thumbnail,
                size: song.size,
                cached: song.cached,
                dlobj: song.dlobj,
                type: song.type
            }).save();
        } else{
            return song.save();
        }
    }

    public async setCached(uid: string, cached: boolean): Promise<void> {
        this.logger.verbose(`Setting cache state of song ${uid} to ${cached}`);
        await MongoDB.Song.updateOne(
            {
                uid
            }, {
                $set: {"cached": cached}
            }
        );
    }

    public async isCached(uid: string): Promise<boolean> {
        this.logger.verbose(`Checking cache state of song ${uid}`);
        const songDoc = await MongoDB.Song.findOne({uid});
        if (songDoc == null) return false;
        return songDoc.cached;
    }
}
