import {BaseCommand, CommandException} from "../base-command";
import {CommandType} from "../command-type";
import {GuildManager} from "../../app/guild";
import {Message, EmbedBuilder, CacheType, CommandInteractionOptionResolver, GuildMember, ChatInputCommandInteraction} from "discord.js";
import {getInfoWithArg, helpTemplate, isNum, ytPlIdExtract} from "../../utils/utils";
import {SongInfo} from "../../data/model/song-info";
import * as api from "../../data/datasources/bilibili-api";
import {bvidExtract} from "../../data/datasources/bilibili-api";
import {PlaylistDataSource} from "../../data/datasources/playlist-datasource";
import {Logger} from "winston";
import {PlaylistsCommand} from "./playlists";
import {PlaylistDoc} from "../../data/db/schemas/playlist";
import { getLogger } from "utils/logger";

const plArgs = {
    dumpSingleJson: true,
    noWarning: true,
    flatPlaylist: true,
}

interface OptionType {name: string, url: string, index?: number}

export class LoadCommand extends BaseCommand {

    public constructor() {
        super([], CommandType.LOAD);
    }

    public async executeHandler(_member: GuildMember, _guild: GuildManager, _args: Omit<CommandInteractionOptionResolver<CacheType>, "getMessage" | "getFocused">, _: ChatInputCommandInteraction): Promise<void> {
        this.run(_member, _guild, {name: _args.getString('name') ?? "", url: _args.getString('url') ?? "", index: _args.getInteger('index') ?? undefined})
    }

    public async run(member: GuildMember, guild: GuildManager, options: OptionType): Promise<void> {
        guild.checkMemberInChannel(member);
        if (!options.name && !options.url && !options.index) {
            throw CommandException.UserPresentable(`Please provide a valid url or name or index to the playlist!`);
        }
        const name = options.name;
        const url = options.url;
        if(LoadCommand.checkArg(name) == 0) throw CommandException.UserPresentable(`Please provide a valid name to the playlist!`);
        // If query exists, check if it is a valid url and the type of URL it refers to
        if (url) {
            const type = ytPlIdExtract(url) ? '-y' : bvidExtract(url) ? '-b' : null;
            // Read from existing playlist with URL
            if (type === '-y') {
                await LoadCommand.loadYouTubeList(member, guild, url, false, this.logger);
            } else {
                await LoadCommand.loadBiliBiliList(member, guild, url, false, this.logger);
            }
        }
        this.load(member, guild, options)
    }

    private async load(member: GuildMember, guild: GuildManager, options: Omit<OptionType, "url">): Promise<void> {

        const playlist = options.index ? await PlaylistsCommand.getPlaylistFromIndex(guild, member.user, options.index) : await PlaylistDataSource.getInstance().get(member.user, options.name);
        // If playlist with collection name doesn't exist.
        if (!playlist) throw CommandException.UserPresentable(`Playlist *${options.name || options.index}* does not exist!`);

        this.logger.info(`Loading from ${playlist.name}`);
        const songDocs = await guild.dataManager.loadFromPlaylist(member.user, playlist);

        if (songDocs.length === 0) {
            throw CommandException.UserPresentable('Playlist is empty');
        }
        for (const doc of songDocs) {
            const song = await SongInfo.withRecord(doc, member);
            guild.queueManager.pushSong(song, true);
        }
        guild.printEvent(`<@${member.user.id}> Playlist *${playlist.name}* successfully loaded`);

    }

    /**
     * Load videos from youtube playlist
     * @param member Discord member that called this command
     * @param guild The guild manager the client is in
     * @param url URL of the YouTube playlist
     * @param save To save the playlist or not
     * @param logger A command logger to log info
     * @param playlistDoc? Name of the Playlist to be saved
     * @private
     */
    public static async loadYouTubeList(
        member: GuildMember,
        guild: GuildManager,
        url: string,
        save: boolean,
        logger: Logger,
        playlistDoc?: PlaylistDoc): Promise<void> {
        // Collect playlist information
        const result = await getInfoWithArg(url, plArgs);
        if (!result) throw CommandException.UserPresentable(`Invalid YouTube playlist url!`)
        const songs = result['entries'];

        // Start loading the song from playlist
        if (Array.isArray(songs)) {
            const plTitle = (result.title && result.title !== '') ? result.title : 'YouTube playlist';
            guild.printEvent(`Start to load from playlist *${plTitle}*, please be patient...`);
            for (const song of songs) {
                try {
                    logger.info(`Now loading song: ${song.title}`);
                    const url = `https://www.youtube.com/watch?v=${song.id}`;
                    const entity = await SongInfo.withUrl(url, member);

                    // Either save or play the song
                    if (save && playlistDoc) await guild.dataManager.saveToPlaylist(entity, entity.initiator.user, playlistDoc);
                    else guild.queueManager.pushSong(entity, true);
                } catch (err) {
                    // Skip duplicated error on batch load
                    logger.warn(err);
                }
            }
            guild.printEvent(`Successfully loaded YouTube playlist ${plTitle}${(playlistDoc ? ' into *' + playlistDoc.name + '*': '')}`);
            logger.info(`Successfully loaded YouTube playlist ${plTitle}`);
        } else {
            throw CommandException.UserPresentable("Please use a valid YouTube playlist");
        }
    }

    /**
     * Load videos from BiliBili playlist
     * @param message Discord message that called this command
     * @param guild The guild manager the client is in
     * @param url URL of the YouTube playlist
     * @param save To save the playlist or not
     * @param logger A command logger to log info
     * @param playlistDoc? Name of the Playlist to be saved
     * @private
     */
    public static async loadBiliBiliList(
        member: GuildMember,
        guild: GuildManager,
        url: string,
        save: boolean,
        logger: Logger,
        playlistDoc?: PlaylistDoc
    ): Promise<void> {
        // Collect playlist information
        const songs = await api.getBiliInfo(url);
        if (!songs) throw CommandException.UserPresentable(`Invalid BiliBili playlist url!`);

        // Start loading the song from playlist
        guild.printEvent(`Start to load from playlist *${songs.mainTitle}*, please be patient...`);
        for (const song of songs.cidList) {
            logger.info(`Now loading song: ${song.part}`);
            try {
                const url = `https://www.bilibili.com/video/${songs.bvId}?p=${song.page}`
                const entity = await SongInfo.withUrl(url, member);

                // Either save or play the song
                if (save) await guild.dataManager.saveToPlaylist(entity, member.user, playlistDoc);
                else guild.queueManager.pushSong(entity, true)
            } catch (err: any) {
                // Skip duplicated error on batch load
                logger.warn(err.toString());
            }
        }
        guild.printEvent(`Successfully loaded BiliBili playlist ${songs.mainTitle}${(playlistDoc ? ' into *' + playlistDoc.name + '*': '')}`);
        logger.info(`Successfully loaded BiliBili playlist ${songs.mainTitle}`);
    }

    public static checkArg(name: string): number {
        const opts = ytPlIdExtract(name) ? '-y' : bvidExtract(name) ? '-b' : null;
        if(!name) return 0;
        else if (opts) return 1;
        else if(isNum(name)) return 2;
        return 0;
    }

    public helpMessage(guild: GuildManager): EmbedBuilder {
        const res = helpTemplate(this);
        const pref = `${guild.commandPrefix}${this.name}`;
        res.addFields({name: 'Usage: ', value: `${pref} <list-name>/<list-url> (To just play the playlist)
                ${pref} <index> (To play an entire playlist)`});
        return res;
    }
}
