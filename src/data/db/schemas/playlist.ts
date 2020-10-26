import {Document, Schema} from "mongoose";

const playlistSchema = new Schema({
    name: {type: String, required: true},
    creator: {type: String, required: true},
    songs: {
        type: [
            {type: Schema.Types.ObjectId, ref: 'Song'}
        ],
        required: true
    },
    guildId: {type: String, required: true, ref: 'Guild'},
    default: {type: Boolean, required: true}
}, {
    writeConcern: {
        w: 'majority',
        j: true,
        wtimeout: 1000
    }
});

playlistSchema.index({name: 1, guildId: 1}, {unique: true});


export interface PlaylistDoc extends Document {
    name: string;
    creator: string;
    songs: Schema.Types.ObjectId[];
    guildId: string;
    default: boolean;
}
export const PlaylistSchema = playlistSchema;
