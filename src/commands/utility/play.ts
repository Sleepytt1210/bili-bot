import {BaseCommand, CommandException} from "../base-command";
import {CommandType} from "../command-type";
import {GuildManager} from "../../app/guild";
import {CacheType, CommandInteractionOptionResolver, SlashCommandStringOption} from "discord.js";
import {SongInfo} from "../../data/model/song-info";
import {SongDataSource} from "../../data/datasources/song-datasource";
import {ytPlIdExtract} from "../../utils/utils";
import {ytSearch} from "../../data/datasources/bilibili-api";
import { GuildMember } from "discord.js";
import { ChatInputCommandInteraction } from "discord.js";

export class PlayCommand extends BaseCommand {

    public constructor() {
        super(['p'], CommandType.PLAY);
        this.addStringOption(new SlashCommandStringOption()
            .setName("url")
            .setDescription("URL of the BiliBili or YouTube video."))
    }

    public async executeHandler(member: GuildMember, guild: GuildManager, args: Omit<CommandInteractionOptionResolver<CacheType>, "getMessage" | "getFocused">, _: ChatInputCommandInteraction): Promise<void> {
        
        let song = null;

        guild.checkMemberInChannel(member);

        const query = args.getString("query");
        const url = args.getString("url");
        if (!query && !url) {
            throw CommandException.UserPresentable("Please specify at least query or url!");
        } else if (url) {
            const plid = ytPlIdExtract(url);
            if (plid) {
                await guild.commandEngine.commands.get(CommandType.LOAD)?.run(member, guild, {url: url});
                return Promise.resolve();
            }
            song = await SongInfo.withUrl(url, member);
        } else if (query) {
            const url2 = await ytSearch(query);
            if (!url2) throw CommandException.UserPresentable(`No result found for \`${query}\`!`);
            song = await SongInfo.withUrl(url2, member);
        } else {
            throw CommandException.UserPresentable(`Please specify at least query or url!`);
        }
        if (!await SongDataSource.getInstance().getOne(song.uid)) {
            await SongDataSource.getInstance().insert(song);
        }
        guild.queueManager.pushSong(song);
    }
}
