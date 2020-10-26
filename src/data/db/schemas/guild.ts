import {Document, Schema} from "mongoose";

const guildSchema = new Schema({
    uid: {type: String, required: true, unique: true},
    serverName: {type: String, required: true},
    joinedAt: {type: Schema.Types.Date, required: true},
    commandPrefix: {type: String, required: true}
}, {
    writeConcern: {
        w: 'majority',
        j: true,
        wtimeout: 1000
    }
});

export interface GuildDoc extends Document {
    uid: string;
    serverName: string;
    joinedAt: Date;
    commandPrefix: string;
}
export const GuildSchema = guildSchema;
