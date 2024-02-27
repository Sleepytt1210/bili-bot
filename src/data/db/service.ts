import {Logger, getLogger} from "../../utils/logger.js";
import Config from "../../configuration.js";
import {Model, Mongoose} from "mongoose";
import mongoose from "mongoose";
import {SongDoc, SongSchema} from "./schemas/song.js";
import {GuildDoc, GuildSchema} from "./schemas/guild.js";
import {PlaylistDoc, PlaylistSchema} from "./schemas/playlist.js";
import { BiliApiSessionDoc, BiliApiSessionSchema } from "./schemas/bili-api-session.js";
// import Inc from 'mongoose-sequence';

class MongoDBService {
    private uri: string;
    private dbName: string;

    protected readonly logger: Logger;
    private client: Mongoose;

    // Models
    public Guild: Model<GuildDoc>;
    public Song: Model<SongDoc>;
    public Playlist: Model<PlaylistDoc>;
    public BiliApiSession: Model<BiliApiSessionDoc>;

    public constructor() {
        this.logger = getLogger('MongoDB');
    }

    public async start(): Promise<boolean> {
        try {
            this.uri = Config.getMongoUri();
            this.dbName = Config.getMongoDatabaseName();
            this.logger.info('Connecting to ' + this.dbName);
            this.client = await mongoose.connect(this.uri);
            this.logger.info('Connected to ' + this.dbName);

            this.Guild = this.client.model('Guild', GuildSchema);
            this.Song = this.client.model('Song', SongSchema);
            this.Playlist = this.client.model('Playlist', PlaylistSchema);
            this.BiliApiSession = this.client.model('BiliApiSession', BiliApiSessionSchema)
            return true
        } catch (error) {
            this.logger.error(`MongoDB connection error: ${error}`);
            return false
        }
    }

    public isConnected(): boolean {
        return this.client.connection.readyState === 1;
    }
}

const MongoDB = new MongoDBService();
export default MongoDB;
