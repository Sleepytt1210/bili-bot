// export class RandomCommand extends BaseCommand {
//     public type(): CommandType {
//         return CommandType.RANDOM;
//     }
//
//     public async executeHandler(member: GuildMember, guild: GuildManager, args: Omit<CommandInteractionOptionResolver<CacheType>, "getMessage" | "getFocused">, interaction: ChatInputCommandInteraction): Promise<void> {
//         guild.checkMemberInChannel(member);
//         await this.doRandom(message, guild, args[0], args[1]);
//     }
//
//     public helpMessage(): string {
//         return 'random <playlist|-b> <category>';
//     }
//
//     private async doRandom(message: Message, guild: GuildManager, source?: string, category?: string): Promise<void> {
//         this.logger.info(`Random request - source: ${source}`);
//         let song: BilibiliSong;
//         if (source) {
//             if (source == '-b') {
//                 song = await RandomCommand.doBilibiliRandom(message, guild, category);
//             } else {
//                 song = await RandomCommand.doLocalRandom(message, guild, source);
//             }
//         } else {
//             song = await RandomCommand.doLocalRandom(message, guild);
//         }
//         await guild.joinChannel(message);
//         guild.queueManager.pushSong(song);
//     }
//
//     private static async doLocalRandom(message: Message, guild: GuildManager, playlist?: string): Promise<BilibiliSong> {
//         const songs = await guild.dataManager.loadFromPlaylist(message.author, playlist);
//
//         if (playlist) {
//             message.reply(`Random selecting from ${playlist}`);
//         } else {
//             message.reply('Random selecting from default playlist');
//         }
//         const randomIndex = Math.floor(Math.random() * (songs.length - 1));
//
//         const songdoc = songs[randomIndex];
//
//         return BilibiliSong.withRecord(songdoc, message.author);
//     }
//
//     private static async doBilibiliRandom(message: Message, guild: GuildManager, category?: string): Promise<BilibiliSong> {
//         category = category || 'music';
//
//         const entity = await api.randomRanking(category, 'all');
//         const embed = new EmbedBuilder()
//             .setTitle('Random result:')
//             .setDescription(`${entity.title} - ${entity.play} plays`)
//             .setColor(biliblue);
//         await guild.activeTextChannel.send(embed);
//         const songEntity = await api.videoDet(entity.url);
//         const songEntityDl = await api.dlurl(songEntity);
//         return BilibiliSong.withSongEntity(songEntityDl, message.author);
//     }
// }
