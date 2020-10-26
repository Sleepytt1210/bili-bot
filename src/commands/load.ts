import {BaseCommand, CommandException} from "./base-command";
import {CommandType} from "./command-type";
import {GuildManager} from "../app/guild";
import {Message, MessageEmbed} from "discord.js";
import {getInfoWithArg, helpTemplate, isNum, ytPlIdExtract} from "../utils/utils";
import {BilibiliSong} from "../data/model/bilibili-song";
import * as api from "../data/datasources/bilibili-api";
import {PlaylistDataSource} from "../data/datasources/playlist-datasource";
import {bvidExtract} from "../data/datasources/bilibili-api";

export class LoadCommand extends BaseCommand {

    public name(): CommandType {
        return CommandType.LOAD;
    }

    public async run(message: Message, guild: GuildManager, args?: string[]): Promise<void> {
        guild.checkMemberInChannel(message.member);
        let name = args.join(" ");
        const query = args.shift();
        const opt = ytPlIdExtract(query) ? '-y' : bvidExtract(query) ? '-b' : null;
        if (opt) {
            name = args.join(" ");
            LoadCommand.checkArg(name);
            if(!name){
                await this.load(message, guild, name, opt, query);
            }else{
                if(opt === '-y'){
                    this.logger.info('Loading from YouTube playlist');
                    await this.loadYoutubeList(message, guild, query, name);
                }else if(opt === '-b'){
                    this.logger.info('Loading from Bilibili playlist');
                    await this.loadBilibiliList(message, guild, query, name);
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
        } else if (name || !name) {
            LoadCommand.checkArg(name);
        } else {
            message.channel.send(this.helpMessage(guild));
            return;
        }
        this.logger.info(`Loading from ${name}`);
        await this.load(message, guild, name);
        guild.setPreviousCommand("load");
    }

    private async load(message: Message, guild: GuildManager, collection?: string, arg?: string, url?: string): Promise<void> {
        if (!guild.queueManager.activeConnection) {
            await guild.joinChannel(message);
        }
        if(arg){
            if(arg === '-y'){
                const plId = ytPlIdExtract(url);
                if(!plId) throw CommandException.UserPresentable(`Invalid YouTube playlist url!`);
                const plurl = `https://www.youtube.com/playlist?list=${plId}`;
                const result = await getInfoWithArg(plurl, ['--flat-playlist', '-i']);
                if(!result) throw CommandException.UserPresentable(`Invalid YouTube playlist url!`);
                if(Array.isArray(result)) {
                    for (const song of result) {
                        this.logger.info(`Now loading song: ${song.title}`);
                        const url = `https://www.youtube.com/watch?v=${song.id}`;
                        const entity = await BilibiliSong.withUrl(url, message.author);
                        guild.queueManager.pushSong(entity);
                    }
                }
            }else{
                const result = (await api.getBasicInfo(url).catch((error) => {
                    throw error;
                }));
                for (const song of result.cidList){
                    this.logger.info(`Now loading song: ${song['part']}`);
                    const url = `https://www.bilibili.com/video/${result.bvId}?p=${song['page']}`
                    const entity = await BilibiliSong.withUrl(url, message.author);
                    guild.queueManager.pushSong(entity);
                }
            }
        }else {
            const playlist = await PlaylistDataSource.getInstance().get(message.author, collection);
            if (!playlist) throw CommandException.UserPresentable(`Playlist ${collection} does not exist!`);
            const songDocs = await guild.dataManager.loadFromPlaylist(message.author, playlist);

            if (songDocs.length === 0) {
                throw CommandException.UserPresentable('Playlist is empty');
            }
            for (const doc of songDocs) {
                const song = await BilibiliSong.withRecord(doc, message.author);
                guild.queueManager.pushSong(song);
                // await msg.edit(new MessageEmbed()
                //     .setDescription(`${song.title} is added to queue, current number of songs in the list: ${guild.queueManager.queue.length}`)
                //     .setColor(0x0ACDFF));
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

    private async loadYoutubeList(
        message: Message,
        guild: GuildManager,
        url: string,
        collection?: string,
    ): Promise<void> {
        const plId = ytPlIdExtract(url);
        if(!plId) throw CommandException.UserPresentable(`Invalid YouTube playlist url!`);
        const plurl = `https://www.youtube.com/playlist?list=${plId}`;
        const result = await getInfoWithArg(plurl, ['--flat-playlist', '-i']);
        if(!result) throw CommandException.UserPresentable(`Invalid YouTube playlist url!`);
        const pds = PlaylistDataSource.getInstance();
        let playlist = await pds.get(message.author, collection);
        if(!playlist) {
            await pds.create(collection, guild.id, message.author).then((doc): void => {
                playlist = doc;
                guild.printEvent(`Playlist ${collection} created!`);
            });
        }
        if (Array.isArray(result)) {
            guild.printEvent("Start loading from youtube playlist, please be patient...");
            // doing this sync'ly now, might change later
            for (const song of result) {
                this.logger.info(`Now loading song: ${song.title}`);
                const url = `https://www.youtube.com/watch?v=${song.id}`;
                const entity = await BilibiliSong.withUrl(url, message.author);
                if (!song.url) continue;
                try {
                    await guild.dataManager.saveToPlaylist(entity, entity.initiator, playlist);
                } catch (err) {
                    // Skip duplicated error on batch load
                    this.logger.warn(err.toString());
                }
            }
            guild.printEvent(`Successfully loaded youtube playlist ${collection}`);
        } else {
            throw CommandException.UserPresentable("Please use a valid youtube playlist");
        }
    }

    private async loadBilibiliList(
        message: Message,
        guild: GuildManager,
        listUrl: string,
        listName: string
    ): Promise<void>{
        try {
            const info = await api.getBasicInfo(listUrl).catch((error) => {
                throw error;
            });
            const pds = PlaylistDataSource.getInstance();
            let playlist = await pds.get(message.author, listName);
            if(!playlist) {
                await pds.create(listName, guild.id, message.author).then((doc): void => {
                    playlist = doc;
                    guild.printEvent(`Playlist ${listName} created!`);
                });
            }
            guild.printEvent(`Start to load from the playlist ${info.mainTitle}`);
            for (const song of info.cidList){
                this.logger.info(`Now loading song: ${song['part']}`);
                try {
                    const url = `https://www.bilibili.com/video/${info.bvId}?p=${song['page']}`
                    const entity = await api.getBasicInfo(url).catch((error) => {
                        throw error;
                    });
                    await guild.dataManager.saveToPlaylist(entity, message.author, playlist);
                } catch (err) {
                    // Skip duplicated error on batch load
                    this.logger.warn(err.toString());
                }
            }
            guild.printEvent(`Successfully loaded ${listName}`);
            this.logger.info(`Successfully loaded Bilibili playlist ${info.mainTitle}`);
        } catch(err){
            this.logger.error(`Bilibili load: ${err}`);
            throw CommandException.UserPresentable("Fail to load list!");
        }
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
        res.addField('Usage: ', `${pref} <list-name> (To play the list)
                ${pref} <list-url> <name> (To save as playlist)
                ${pref} <index> (To choose from playlists)`);
        return res;
    }
}
