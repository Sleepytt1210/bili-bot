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
    private redisHost: string;
    private redisPort: string;
    private redisPassword: string;

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

        if (!process.env.REDIS_HOST) {
            this.logger.error('Missing "REDIS_HOST" in env');
            return false;
        }

        if (!process.env.REDIS_PORT) {
            this.logger.error('Missing "REDIS_PORT" in env');
            return false;
        }

        this.discordToken = process.env.DiscordToken;
        this.mongoUri = process.env.MONGO_URI;
        this.mongoDatabaseName = process.env.DB_NAME;
        this.ytApiKey = process.env.YTApiKey;
        this.redisHost = process.env.REDIS_HOST;
        this.redisPort = process.env.REDIS_PORT;
        this.redisPassword = process.env.REDIS_PORT;

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

    public getRedisHost(): string {
        return this.redisHost;
    }

    public getRedisPort(): string {
        return this.redisPort;
    }

    public getRedisPassword(): string {
        return this.redisPassword;
    }
}

const configuration = Configuration.getInstance();
export default configuration;
