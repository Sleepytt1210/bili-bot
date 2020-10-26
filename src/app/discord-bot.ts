import {Client, Message, MessageEmbed} from 'discord.js';
import {Logger, getLogger} from "../utils/logger";
import {GuildManager} from "./guild";
import {GuildDataSource} from "../data/datasources/guild-datasource";


export class DiscordBot {
    private readonly token: string;
    private logger: Logger;
    private client: Client;
    private guilds: Map<string, GuildManager>;

    public constructor(token: string) {
        this.logger = getLogger('DiscordBot');
        this.token = token;
        this.client = new Client();
        this.guilds = new Map<string, GuildManager>();
    }

    public run(): void {
        this.client.login(this.token);
        this.client.once('ready', async (): Promise<void> => {
            await this.clientReady();
            await this.client.user.setActivity("bilibili", {type: "WATCHING"});
            this.client.on('message', async (msg): Promise<void> => {
                await this.handleMessage(msg)
            });
            this.client.on('voiceStateUpdate', (oldState, newState) => {

                if (!oldState || !newState) return;

                const oldChannel = oldState.channel ? oldState.channel.id : null;
                const newChannel = newState.channel ? newState.channel.id : null;

                const guildId = oldState.guild.id
                const guild = this.guilds.get(guildId)
                const bot = this.client.guilds.resolve(guildId).member(this.client.user.id)

                if(oldState.member.id === bot.id && oldChannel !== newChannel) {
                    if(!newChannel) {
                        if(guild.queueManager.activeConnection != null) {
                            guild.queueManager.stop();
                            guild.queueManager.activeConnection.disconnect();
                            guild.queueManager.activeConnection.voice.setChannel(null);
                            const embed = new MessageEmbed()
                                .setTitle(`${bot.displayName}`)
                                .setDescription(`has left the voice channel!`)
                                .setColor(0x0ACDFF);
                            guild.activeTextChannel.send(embed);
                            guild.queueManager.activeConnection = null;
                        }
                    } else if(oldChannel !== null){
                        const msg = new MessageEmbed()
                            .setTitle(`${bot.displayName}`)
                            .setDescription(`is moved to channel ${newState.channel.name}`)
                            .setColor(0x0ACDFF);
                        guild.activeTextChannel.send(msg);
                    }
                }
            })
        });
    }

    private async clientReady(): Promise<void> {
        this.logger.info(`BiliBot logged in as ${this.client.user.username}`);
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
            await GuildDataSource.getInstance().insert(newManager);
        }
        await this.guilds.get(guildId).processMessage(msg);
    }
}
