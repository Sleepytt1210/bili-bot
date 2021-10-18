import {BaseCommand, CommandException} from "./base-command";
import {CommandType} from "./command-type";
import {GuildManager} from "../app/guild";
import {Message, MessageEmbed} from "discord.js";
import {getInfoWithArg, helpTemplate, isNum, ytPlIdExtract} from "../utils/utils";
import {SongInfo} from "../data/model/song-info";
import * as api from "../data/datasources/bilibili-api";
import {bvidExtract} from "../data/datasources/bilibili-api";
import {PlaylistDataSource} from "../data/datasources/playlist-datasource";
import {Logger} from "winston";

const plArgs = {
    dumpSingleJson: true,
    noWarning: true,
    flatPlaylist: true,
}

export class LoadCommand extends BaseCommand {

    public constructor() {
        super([]);
    }

    public name(): CommandType {
        return CommandType.LOAD;
    }

    public async run(message: Message, guild: GuildManager, args?: string[]): Promise<void> {
        guild.checkMemberInChannel(message.member);
        let name = args.join(" ");
        const query = args.shift();
        // If query exists, check if it is a valid url and the type of URL it refers to
        const type = (query) ? ytPlIdExtract(query) ? '-y' : bvidExtract(query) ? '-b' : null : null;
        if (type) {
            // Read from existing playlist with URL
            await this.load(message, guild, null, type, query);
            return;
        } else if (isNum(query)) {
            if (guild.previousCommand !== "playlists") throw CommandException.UserPresentable(`Please use \`${guild.commandPrefix}playlist list\` first!`)
            const lists = await guild.dataManager.showPlayLists(message.author);
            const index = Number.parseInt(query);
            if (index < 1 || index > lists.length)
                throw CommandException.OutOfBound(lists.length);
            name = lists[index - 1].name;
        } else if (name) {
            // Read from existing playlist with name
            LoadCommand.checkArg(name);
        } else {
            message.channel.send({embeds: [this.helpMessage(guild)]});
            return;
        }
        this.logger.info(`Loading from ${name}`);
        await this.load(message, guild, name);
        guild.setPreviousCommand("load");
    }

    private async load(message: Message, guild: GuildManager, collection?: string, type?: string, url?: string): Promise<void> {

        // If type exists it means a valid url is given.
        if (type && url) {
            if (type === '-y') {
                await LoadCommand.loadYouTubeList(message, guild, url, false, this.logger);
            } else {
                await LoadCommand.loadBiliBiliList(message, guild, url, false, this.logger);
            }
            // A name could be given instead
        } else {
            const playlist = await PlaylistDataSource.getInstance().get(message.author, collection);
            if (!playlist) throw CommandException.UserPresentable(`Playlist ${collection} does not exist!`);
            const songDocs = await guild.dataManager.loadFromPlaylist(message.author, playlist);

            if (songDocs.length === 0) {
                throw CommandException.UserPresentable('Playlist is empty');
            }
            for (const doc of songDocs) {
                const song = await SongInfo.withRecord(doc, message.member);
                guild.queueManager.pushSong(song);
            }
            guild.printEvent(`<@${message.author.id}> Playlist ${collection} successfully loaded`);
        }

        //var songs = [];
        // const first = await BilibiliSong.withUrl(songDocs.shift().url, message.author);
        // guild.queueManager.pushSong(first);
        // const embed = guild.printAddToQueue(first, guild.queueManager.queue.length);
        // guild.activeTextChannel.send(embed).then(async (msg): Promise<void> => {
        //
        // });

        //guild.queueManager.pushSongs(songs);
    }

    /**
     * Load videos from youtube playlist
     * @param message Discord message that called this command
     * @param guild The guild manager the client is in
     * @param url URL of the YouTube playlist
     * @param save To save the playlist or not
     * @param logger A command logger to log info
     * @param collection? Name of the Playlist to be saved
     * @private
     */
    public static async loadYouTubeList(
        message: Message,
        guild: GuildManager,
        url: string,
        save: boolean,
        logger: Logger,
        collection?: string): Promise<void> {
        // Collect playlist information
        const result = await getInfoWithArg(url, plArgs);
        if (!result) throw CommandException.UserPresentable(`Invalid YouTube playlist url!`)
        const songs = result['entries'];

        // Create PlaylistDatasource instance
        const pds = PlaylistDataSource.getInstance();

        let playlist;

        // Only find a playlist if a name is given
        if (collection) playlist = await pds.get(message.author, collection);

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
                    if (save) await guild.dataManager.saveToPlaylist(entity, entity.initiator.user, playlist);
                    else guild.queueManager.pushSong(entity, true);
                } catch (err) {
                    // Skip duplicated error on batch load
                    logger.warn(err.toString());
                }
            }
            guild.printEvent(`Successfully loaded YouTube playlist ${plTitle}${(collection ? ' into *' + collection + '*': '')}`);
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
     * @param collection? Name of the Playlist to be saved
     * @private
     */
    public static async loadBiliBiliList(
        message: Message,
        guild: GuildManager,
        url: string,
        save: boolean,
        logger: Logger,
        collection?: string
    ): Promise<void> {
        // Collect playlist information
        const songs = await api.getBasicInfo(url);
        if (!songs) throw CommandException.UserPresentable(`Invalid BiliBili playlist url!`)
        // Create PlaylistDatasource instance
        const pds = PlaylistDataSource.getInstance();
        let playlist;

        // Only find a playlist if a name is given
        if (collection) playlist = await pds.get(message.author, collection);

        // Start loading the song from playlist
        guild.printEvent(`Start to load from playlist *${songs.mainTitle}*, please be patient...`);
        for (const song of songs.cidList) {
            logger.info(`Now loading song: ${song.part}`);
            try {
                const url = `https://www.bilibili.com/video/${songs.bvId}?p=${song.page}`
                const entity = await SongInfo.withUrl(url, message.member);

                // Either save or play the song
                if (save) await guild.dataManager.saveToPlaylist(entity, message.author, playlist);
                else guild.queueManager.pushSong(entity, true)
            } catch (err) {
                // Skip duplicated error on batch load
                logger.warn(err.toString());
            }
        }
        guild.printEvent(`Successfully loaded BiliBili playlist ${songs.mainTitle}${(collection ? ' into *' + collection + '*': '')}`);
        logger.info(`Successfully loaded BiliBili playlist ${songs.mainTitle}`);
    }

    public static checkArg(name: string): void {
        const opts = ytPlIdExtract(name) ? '-y' : bvidExtract(name) ? '-b' : null;
        if(!name) throw CommandException.UserPresentable(`Please provide a name to the playlist!`);
        else if (opts) throw CommandException.UserPresentable(`Please do not use playlist url as name!`);
        else if(isNum(name)) throw CommandException.UserPresentable(`Please do not use number as name!`)
    }

    public helpMessage(guild: GuildManager): MessageEmbed {
        const res = helpTemplate(this);
        const pref = `${guild.commandPrefix}${this.name()}`;
        res.addField('Usage: ', `${pref} <list-name>/<list-url> (To just play the playlist)
                ${pref} <index> (To play an entire playlist)`);
        return res;
    }
}
