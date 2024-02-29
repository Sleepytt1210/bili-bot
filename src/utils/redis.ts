// redisClient.ts
import * as redis from "redis";
import { promisify } from "util";
import dotenv from "dotenv";
import configuration from "../configuration.js";
import { Logger, getLogger } from "./logger.js";

dotenv.config();

class RedisFacade {
	private client: redis.RedisClientType;
	private getAsync: (arg1: string) => Promise<string | null>;
	private setAsync: (arg1: string, arg2: string, options?: { EX: number }) => Promise<string>;
	private delAsync: (arg1: string) => Promise<number>;
	private logger: Logger;

	constructor() {
		this.logger = getLogger("RedisClient");

		const redisOptions = {
			socket: {
				host: configuration.getRedisHost(),
				port: parseInt(configuration.getRedisPort(), 10),
				// Add other options as needed
			},
		};

		if (configuration.getRedisPassword()) {
			(redisOptions["username"] = process.env.REDIS_USERNAME || "default"),
				(redisOptions["password"] = configuration.getRedisPassword());
		}

		this.client = redis.createClient(redisOptions).connect();
		this.getAsync = promisify(this.client.get).bind(this.client);
		this.setAsync = promisify(this.client.set).bind(this.client);
		this.delAsync = promisify(this.client.del).bind(this.client);

		this.client.on("error", (err) => {
			this.logger.error("Redis error:", err);
		});
	}

	async set(key: string, value: string, expiry: number = 0): Promise<boolean> {
		try {
			if (expiry > 0) {
				await this.setAsync(key, value, {
					EX: expiry,
				});
			} else {
				await this.setAsync(key, value);
			}
			this.logger.info(`Set ${key} to ${value}`);
			return true;
		} catch (error) {
			this.logger.error("Error setting value in Redis:", error);
			return false;
		}
	}

	async get(key: string): Promise<string | null> {
		try {
			const value = await this.getAsync(key);
			this.logger.info(`Got ${key}: ${value}`);
			return value;
		} catch (error) {
			this.logger.error("Error getting value from Redis:", error);
			return null;
		}
	}

	async del(key: string): Promise<boolean> {
		try {
			await this.delAsync(key);
			this.logger.info(`Deleted ${key}`);
			return true;
		} catch (error) {
			this.logger.error("Error deleting value from Redis:", error);
			return false;
		}
	}

	quit(): void {
		this.client.disconnect();
	}
}

export default new RedisFacade();
