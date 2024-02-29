import {DiscordBot} from "./app/discord-bot.js";
import Config from "./configuration.js";
import {getLogger} from "./utils/logger.js";
import MongoDB from "./data/db/service.js";
import exitHook from "exit-hook";
import Redis from "./utils/redis.js";

const logger = getLogger("app.js");

async function setup(): Promise<boolean> {
    return MongoDB.start();
}

async function main(): Promise<void> {
    if (!Config.parse()) {
        logger.error('Failed to parse configuration file, exiting...');
        process.exit(1);
    }

    // Setup exiting hook
    exitHook((): void => {
        logger.info('Exiting...');
        Redis.quit()
    });

    if (await setup()) {
        const bot = new DiscordBot(Config.getDiscordToken());
        bot.run();
    } else {
        logger.error('Setup failed, exiting...');
        process.exit(1);
    }
}

main();
