// import {BaseCommand, CommandException} from "../base-command";
// import {CommandType} from "../command-type";
// import {GuildManager} from "../../app/guild";
// import {Message, EmbedBuilder, CacheType, CommandInteractionOptionResolver, GuildMember} from "discord.js";
// import {SongInfo} from "../data/model/song-info.js";
// import {helpTemplate} from "../../utils/utils";
// import {SongDataSource} from "../data/datasources/song-datasource.js";

// export class SelectCommand extends BaseCommand {


//     public constructor() {
//         super(['sl', 'sel']);
//     }

//     public name: CommandType = CommandType.SELECT;

//     public async executeHandler(member: GuildMember, guild: GuildManager, args: Omit<CommandInteractionOptionResolver<CacheType>, "getMessage" | "getFocused">, interaction: ChatInputCommandInteraction): Promise<void> {
//         guild.checkMemberInChannel(member);
//         const userid = message.author.id;
//         if (args.length === 0) {
//             throw CommandException.UserPresentable('', this.helpMessage(guild));
//         }
//         const index = parseInt(args.shift());
//         if (!Number.isInteger(index)) {
//             throw CommandException.UserPresentable('', this.helpMessage(guild));
//         }

//         const searchBase = (await guild.getCurrentSearchResult(userid)) || (await guild.getCurrentShowlistResult(userid));

//         if (!searchBase) {
//             throw CommandException.UserPresentable(`Invalid Operation: Please do \`${guild.commandPrefix}search\` or \`${guild.commandPrefix}pl list\` first`);
//         }
//         if (searchBase.length === 0) throw CommandException.UserPresentable(`Result is empty! Nothing to select from!`);
//         if (index < 1 || index > searchBase.length) {
//             throw CommandException.OutOfBound(searchBase.length);
//         }

//         const songdoc = searchBase[index-1];
//         const song = await SongInfo.withUrl(songdoc.url, member);
//         const sds = SongDataSource.getInstance();
//         if (!(await sds.getOne(song.uid))) await sds.insert(song);
//         guild.queueManager.pushSong(song);
//     }

//     public helpMessage(guild: GuildManager): EmbedBuilder {
//         const res = helpTemplate(this);
//         res.addFields({name: 'Usage: ', value: `${guild.commandPrefix}${this.name} <index>`});
//         return res;
//     }
// }
