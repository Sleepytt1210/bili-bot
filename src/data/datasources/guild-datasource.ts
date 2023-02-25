import MongoDB from "../db/service.js";
import {getLogger, Logger} from "../../utils/logger.js";
import {GuildDoc} from "../db/schemas/guild.js";
import {GuildManager} from "../../app/guild.js";
import { Schema } from "mongoose";

export class GuildDataSource {
    private static instance: GuildDataSource;
    public static getInstance(): GuildDataSource {
        if (!GuildDataSource.instance) {
            if (!MongoDB.isConnected()) {
                throw new Error('Mongo DB is not connected');
            }
            GuildDataSource.instance = new GuildDataSource();
        }
        return GuildDataSource.instance;
    }

    protected readonly logger: Logger;

    private constructor() {
        this.logger = getLogger('GuildDataSource');
    }

    public async load(): Promise<GuildDoc[]> {
        this.logger.verbose(`Querying all guilds`);
        return MongoDB.Guild.find({});
    }

    public async getOne(uid?: string, _id?: Schema.Types.ObjectId): Promise<GuildDoc> {
        this.logger.verbose(`Querying guild with id=${uid}`);
        return (uid) ? MongoDB.Guild.findOne({uid: uid}) : MongoDB.Guild.findOne({_id: _id});
    }

    public async insert(guildManager: GuildManager): Promise<void> {
        this.logger.verbose(`Inserting guild ${guildManager.id}`);
        await new MongoDB.Guild({
            uid: guildManager.id,
            serverName: guildManager.guild.name,
            joinedAt: guildManager.guild.joinedAt,
            commandPrefix: guildManager.commandPrefix
        }).save();
    }

    public async updatePrefix(guildManager: GuildManager, prefix: string): Promise<void> {
        this.logger.verbose(`Setting command prefix for guild ${guildManager.id} to ${prefix}`);
        guildManager.setPrefix(prefix);
        await MongoDB.Guild.updateOne(
            {
                uid: guildManager.id
            }, {
                $set: {"commandPrefix": guildManager.commandPrefix}
            }
        );
    }
}
