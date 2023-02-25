import {Document, Schema} from "mongoose";
import {SongInfo} from "../../model/song-info.js";
import {User} from "discord.js";

const songSchema = new Schema<SongDoc>({
    uid: {type: String, required: true, unique: true},
    url: {type: String, required: true},
    title: {type: String, required: true},
    author: {type: String, required: true},
    hmsDuration: {type: String, required: true},
    rawDuration: {type: Number, required: true},
    description: String,
    thumbnail: String,
    cached: Boolean,
    dlurls: {type: [Object], required: true},
    type: {type: String, required: true}
}, {
    writeConcern: {
        w: 'majority',
        j: true,
        wtimeout: 1000
    }
});

export interface SongDoc extends Document {
    uid: string;
    url: string;
    title: string;
    author: string;
    hmsDuration: string;
    rawDuration: number;
    description: string|null;
    thumbnail: string|null;
    ext: string;
    size: number;
    cached: boolean|null;
    dlurls: object[];
    type: 'y' | 'b';
    toSong(initiator: User): SongInfo;
}
export const SongSchema = songSchema;
