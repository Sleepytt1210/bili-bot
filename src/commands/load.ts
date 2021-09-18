import {BaseCommand, CommandException} from "./base-command";
import {CommandType} from "./command-type";
import {GuildManager} from "../app/guild";
import {Message, MessageEmbed} from "discord.js";
import {getInfoWithArg, helpTemplate, isNum, ytPlIdExtract} from "../utils/utils";
import {SongInfo} from "../data/model/song-info";
import * as api from "../data/datasources/bilibili-api";
import {PlaylistDataSource} from "../data/datasources/playlist-datasource";
import {bvidExtract} from "../data/datasources/bilibili-api";

export class LoadCommand extends BaseCommand {

    private plArgs = {
        dumpSingleJson: true,
        noWarning: true,
        flatPlaylist: true,
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
            name = args.join(" ");
            LoadCommand.checkArg(name);
            // Read from existing playlist with URL
            if(!name){
                await this.load(message, guild, null, type, query);
            }else{
                // Save as a new playlist
                if(type === '-y'){
                    this.logger.info('Loading from YouTube playlist');
                    await this.loadYouTubeList(message, guild, query, name);
                }else if(type === '-b'){
                    this.logger.info('Loading from BiliBili playlist');
                    await this.loadBiliBiliList(message, guild, query, name);
                }
            }
            return;
        } else if(isNum(query)){
            if(guild.previousCommand !== "playlists") throw CommandException.UserPresentable(`Please use \`${guild.commandPrefix}playlist list\` first!`)
            const lists = await guild.dataManager.showPlayLists(message.author);
            const index = Number.parseInt(query);
            if(index < 1 || index > lists.length)
                throw CommandException.OutOfBound(lists.length);
            name = lists[index-1].name;
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
        if(type && url){
            if(type === '-y'){
                await this.loadYouTubeList(message, guild, url, collection, false)
            }else{
                await this.loadBiliBiliList(message, guild, url, collection, false)
            }
            // A name could be given instead
        }else {
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
     * @param collection Name of the Playlist to be saved
     * @param save To save the playlist or not
     * @private
     */
    private async loadYouTubeList(
        message: Message,
        guild: GuildManager,
        url: string,
        collection?: string,
        save: boolean = true): Promise<void> {
        // Collect playlist information
        const result = await getInfoWithArg(url, this.plArgs);
        if(!result) throw CommandException.UserPresentable(`Invalid YouTube playlist url!`)
        const songs = result['entries'];

        // Create PlaylistDatasource instance
        const pds = PlaylistDataSource.getInstance();

        let playlist;

        // Only find a playlist if a name is given
        if(collection) playlist = await pds.get(message.author, collection);

        if (!playlist && collection) {
            await pds.create(collection, guild.id, message.author).then((doc): void => {
                playlist = doc;
                guild.printEvent(`Playlist ${collection} created!`);
            });
        }

        // Start loading the song from playlist
        if (Array.isArray(songs)) {
            const plTitle = (result.title && result.title !== '') ? result.title : 'YouTube playlist';
            guild.printEvent(`Start to load from ${plTitle}, please be patient...`);
            for (const song of songs) {
                try {
                    this.logger.info(`Now loading song: ${song.title}`);
                    const url = `https://www.youtube.com/watch?v=${song.id}`;
                    const entity = await SongInfo.withUrl(url, message.member);

                    // Either save or play the song
                    if (save) await guild.dataManager.saveToPlaylist(entity, entity.initiator.user, playlist);
                    else guild.queueManager.pushSong(entity, true);
                } catch (err) {
                    // Skip duplicated error on batch load
                    this.logger.warn(err.toString());
                }
            }
            guild.printEvent(`Successfully loaded YouTube playlist ${plTitle}${ (collection ? ' into ' + collection : '') }`);
            this.logger.info(`Successfully loaded YouTube playlist ${plTitle}`);
        } else {
            throw CommandException.UserPresentable("Please use a valid YouTube playlist");
        }
    }

    private async loadBiliBiliList(
        message: Message,
        guild: GuildManager,
        url: string,
        collection?: string,
        save: boolean = true
    ): Promise<void>{
        // Collect playlist information
        const songs = await api.getBasicInfo(url);
        if(!songs) throw CommandException.UserPresentable(`Invalid BiliBili playlist url!`)
        // Create PlaylistDatasource instance
        const pds = PlaylistDataSource.getInstance();
        let playlist;

        // Only find a playlist if a name is given
        if(collection) playlist = await pds.get(message.author, collection);

        if(!playlist && collection) {
            await pds.create(collection, guild.id, message.author).then((doc): void => {
                playlist = doc;
                guild.printEvent(`Playlist ${collection} created!`);
            });
        }

        // Start loading the song from playlist
        guild.printEvent(`Start to load from playlist ${songs.mainTitle}`);
        for (const song of songs.cidList){
            this.logger.info(`Now loading song: ${song.part}`);
            try {
                const url = `https://www.bilibili.com/video/${songs.bvId}?p=${song.page}`
                const entity = await SongInfo.withUrl(url, message.member);

                // Either save or play the song
                if(save) await guild.dataManager.saveToPlaylist(entity, message.author, playlist);
                else guild.queueManager.pushSong(entity, true)
            } catch (err) {
                // Skip duplicated error on batch load
                this.logger.warn(err.toString());
            }
        }
        guild.printEvent(`Successfully loaded BiliBili playlist ${songs.mainTitle}${ (collection ? ' into ' + collection : '') }`);
        this.logger.info(`Successfully loaded BiliBili playlist ${songs.mainTitle}`);
    }

    public static checkArg(name: string): void{
        const opts = ytPlIdExtract(name) ? '-y' : bvidExtract(name) ? '-b' : null;
        if(opts){
            throw CommandException.UserPresentable(`Please do not use playlist url as name!`);
        }
    }

    public helpMessage(guild: GuildManager): MessageEmbed {
        const res = helpTemplate(this.name());
        const pref = `${guild.commandPrefix}${this.name()}`;
        res.addField('Usage: ', `${pref} <list-name>/<list-url> (To just play the playlist)
                ${pref} <list-url> <list-name>  (To save as playlist in cloud storage)
                ${pref} <index> (To choose from playlists)`);
        return res;
    }
}
