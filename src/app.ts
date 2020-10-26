import {DiscordBot} from "./app/discord-bot";
import Config from "./configuration";
import {getLogger} from "./utils/logger";
import MongoDB from "./data/db/service";
import exitHook = require("exit-hook");

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
