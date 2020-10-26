import {Document, Schema} from "mongoose";
import {BilibiliSong} from "../../model/bilibili-song";
import {User} from "discord.js";

const songSchema = new Schema({
    uid: {type: String, required: true, unique: true},
    url: {type: String, required: true},
    title: {type: String, required: true},
    author: {type: String, required: true},
    hmsDuration: {type: String, required: true},
    rawDuration: {type: Number, required: true},
    description: String,
    thumbnail: String,
    cached: Boolean,
    dlurl: {type: String, required: true},
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
    cached: boolean|null;
    dlurl: string;
    type: 'y' | 'b';
    toSong(initiator: User): BilibiliSong;
}
export const SongSchema = songSchema;
