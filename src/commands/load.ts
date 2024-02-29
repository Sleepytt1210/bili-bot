import {BaseCommand, CommandException} from "./base-command.js";
import {CommandType} from "./command-type.js";
import {GuildManager} from "../app/guild.js";
import {Message, EmbedBuilder} from "discord.js";
import {getInfoWithArg, helpTemplate, isNum, ytPlIdExtract} from "../utils/utils.js";
import {SongInfo} from "../data/model/song-info.js";
import * as api from "../data/datasources/bilibili-api.js";
import {bvidExtract} from "../data/datasources/bilibili-api.js";
import {PlaylistDataSource} from "../data/datasources/playlist-datasource.js";
import {Logger} from "winston";
import {PlaylistsCommand} from "./playlists.js";
import {PlaylistDoc} from "../data/db/schemas/playlist.js";

const plArgs = {
    dumpSingleJson: true,
    noWarning: true,
    flatPlaylist: true,
}

export class LoadCommand extends BaseCommand {

    public name: CommandType = CommandType.LOAD;

    public constructor() {
        super([]);
    }

    public async run(message: Message, guild: GuildManager, args?: string[]): Promise<void> {
        guild.checkMemberInChannel(message.member);
        const name = args.join(" ");
        const query = args.shift();
        // If query exists, check if it is a valid url and the type of URL it refers to
        const type = (query) ? ytPlIdExtract(query) ? '-y' : bvidExtract(query) ? '-b' : null : null;
        if (type) {
            // Read from existing playlist with URL
            await this.load(message, guild, null, type, query);
            return;
        } else if (name) {
            // Read from existing playlist with name
            if(LoadCommand.checkArg(name) == 0) throw CommandException.UserPresentable(`Please provide a name to the playlist!`);
        } else {
            throw CommandException.UserPresentable('', this.helpMessage(guild));
        }
        await this.load(message, guild, name);
    }

    private async load(message: Message, guild: GuildManager, collection?: string, type?: string, url?: string): Promise<void> {

        // If type exists it means a valid url is given.
        if (type && url) {
            if (type === '-y') {
                await LoadCommand.loadYouTubeList(message, guild, url, false, this.logger);
            } else {
                await LoadCommand.loadBiliBiliList(message, guild, url, false, this.logger);
            }
            // A name could be given instead, which indicates from user's playlist.
        } else {
            const playlist = isNum(collection) ? await PlaylistsCommand.getPlaylistFromIndex(guild, message, collection) : await PlaylistDataSource.getInstance().get(message.author, collection);
            // If playlist with collection name doesn't exist.
            if (!playlist) throw CommandException.UserPresentable(`Playlist *${collection}* does not exist!`);

            this.logger.info(`Loading from ${playlist.name}`);
            const songDocs = await guild.dataManager.loadFromPlaylist(message.author, playlist);

            if (songDocs.length === 0) {
                throw CommandException.UserPresentable('Playlist is empty');
            }
            for (const doc of songDocs) {
                const song = await SongInfo.withRecord(doc, message.member);
                guild.queueManager.pushSong(song, true);
            }
            guild.printEvent(`<@${message.author.id}> Playlist *${playlist.name}* successfully loaded`);
        }
    }

    /**
     * Load videos from youtube playlist
     * @param message Discord message that called this command
     * @param guild The guild manager the client is in
     * @param url URL of the YouTube playlist
     * @param save To save the playlist or not
     * @param logger A command logger to log info
     * @param playlistDoc? Name of the Playlist to be saved
     * @private
     */
    public static async loadYouTubeList(
        message: Message,
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
                    const entity = await SongInfo.withUrl(url, message.member);

                    // Either save or play the song
                    if (save) await guild.dataManager.saveToPlaylist(entity, entity.initiator.user, playlistDoc);
                    else guild.queueManager.pushSong(entity, true);
                } catch (err) {
                    // Skip duplicated error on batch load
                    logger.warn(err.toString());
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
        message: Message,
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
                const entity = await SongInfo.withUrl(url, message.member);

                // Either save or play the song
                if (save) await guild.dataManager.saveToPlaylist(entity, message.author, playlistDoc);
                else guild.queueManager.pushSong(entity, true)
            } catch (err) {
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
    }

    public helpMessage(guild: GuildManager): EmbedBuilder {
        const res = helpTemplate(this);
        const pref = `${guild.commandPrefix}${this.name}`;
        res.addFields({name: 'Usage: ', value: `${pref} <list-name>/<list-url> (To just play the playlist)
                ${pref} <index> (To play an entire playlist)`});
        return res;
    }
}
