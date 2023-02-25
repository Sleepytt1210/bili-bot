import {getLogger, Logger} from "./utils/logger.js";
import * as dotenv from "dotenv";
dotenv.config();

class Configuration {
    private static instance: Configuration;
    public static getInstance(): Configuration {
        if (!Configuration.instance) {
            Configuration.instance = new Configuration();
        }
        return Configuration.instance;
    }

    protected readonly logger: Logger;

    // Required
    private discordToken: string;
    private mongoUri: string;
    private mongoDatabaseName?: string;
    private ytApiKey: string;

    private constructor() {
        this.logger = getLogger('Configuration');
    }

    public parse(): boolean {
        if (!process.env.DiscordToken){
            this.logger.error('Missing "DiscordToken" in env');
        }
        if (!process.env.MONGO_URI) {
            this.logger.error('Missing "MONGO_URI" in env');
            return false;
        }
        if (!process.env.DB_NAME) {
            this.logger.error('Missing "DB_NAME" in env');
            return false;
        }

        if (!process.env.YTApiKey) {
            this.logger.error('Missing "YTApiKey" in env');
            return false;
        }

        this.discordToken = process.env.DiscordToken;
        this.mongoUri = process.env.MONGO_URI;
        this.mongoDatabaseName = process.env.DB_NAME;
        this.ytApiKey = process.env.YTApiKey;

        return true;
    }

    public getDiscordToken(): string {
        return this.discordToken;
    }

    public getMongoUri(): string {
        return this.mongoUri;
    }

    public getMongoDatabaseName(): string | null {
        return this.mongoDatabaseName;
    }

    public getYTApiKey(): string {
        return this.ytApiKey;
    }
}

const configuration = Configuration.getInstance();
export default configuration;
