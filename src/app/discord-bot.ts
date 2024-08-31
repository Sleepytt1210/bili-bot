import {ActivityType, Client, IntentsBitField, Message} from 'discord.js';
import {Logger, getLogger} from "../utils/logger.js";
import {GuildManager} from "./guild.js";
import {GuildDataSource} from "../data/datasources/guild-datasource.js";
import Config from 'configuration.js';


export class DiscordBot {
    private readonly token: string;
    private logger: Logger;
    private client: Client;
    private guilds: Map<string, GuildManager>;

    public constructor(token: string) {
        const intents = [IntentsBitField.Flags.Guilds,
            IntentsBitField.Flags.GuildEmojisAndStickers,
            IntentsBitField.Flags.GuildMessageReactions,
            IntentsBitField.Flags.GuildMessages,
            IntentsBitField.Flags.GuildMessageTyping,
            IntentsBitField.Flags.MessageContent,
            IntentsBitField.Flags.GuildVoiceStates]
        this.logger = getLogger('DiscordBot');
        this.token = token;
        this.client = new Client({intents: intents});
        this.guilds = new Map<string, GuildManager>();
    }

    private static instance: DiscordBot;

    public static getInstance(): DiscordBot {
        if (!DiscordBot.instance) {
            DiscordBot.instance = new DiscordBot(Config.getDiscordToken());
        }
        return DiscordBot.instance;
    }

    public findGuild(guildId: string): GuildManager | null {
        return this.guilds.get(guildId) ?? null;
    }

    public run(): void {
        this.client.login(this.token);
        this.client.once('ready', async (): Promise<void> => {
            await this.clientReady();
            if (this.client.user) {
                this.client.user.setActivity("BiliBili", {type: ActivityType.Watching});
            }
            this.client.on('messageCreate', async (msg): Promise<void> => {
                await this.handleMessage(msg)
            });
        });
    }

    private async clientReady(): Promise<void> {
        this.logger.info(`BiliBot logged in as ${this.client.user?.username}`);
        const guildDocs = await GuildDataSource.getInstance().load();
        for(const guildDoc of guildDocs) {
            const guild = this.client.guilds.resolve(guildDoc.uid);
            if (guild) {
                this.guilds.set(guild.id, new GuildManager(guild, guildDoc.commandPrefix));
            }
        }
    }

    private async handleMessage(msg: Message): Promise<void> {
        if (!msg.guild) return;
        const guildId = msg.guild.id;
        if (!this.guilds.has(guildId)) {
            const newManager = new GuildManager(msg.guild);
            this.guilds.set(guildId, newManager);
            const gds = GuildDataSource.getInstance();
            if(!await gds.getOne(guildId)) await GuildDataSource.getInstance().insert(newManager);
        }
        await this.guilds.get(guildId)?.processMessage(msg);
    }
}
