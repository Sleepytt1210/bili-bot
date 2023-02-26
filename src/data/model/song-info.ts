import {GuildMember} from "discord.js";
import {getInfo, ytUidExtract} from "../../utils/utils.js";
import {SongDataSource} from "../datasources/song-datasource.js";
import {SongDoc} from "../db/schemas/song.js";
import {BiliSongEntity, getBiliInfo, bvidExtract, toHms} from "../datasources/bilibili-api.js";
import ytdl from "ytdl-core";
import { getLogger } from "../../utils/logger.js";
import { DashAudio, Durl } from "./bilibili-api-types.js";

const logger = getLogger("Song-Info")

export class SongInfo {
    public readonly url: string;
    public readonly dlobj: Durl | DashAudio;
    public readonly title: string;
    public readonly author: string;
    public readonly description: string;
    public readonly thumbnail: string;
    public readonly rawDuration: number;
    public readonly hmsDuration: string;
    public readonly initiator: GuildMember;
    public readonly uid: string;
    public readonly format: string;
    public readonly isLive: boolean;
    public readonly size: number;
    public readonly cached: boolean;
    public readonly type: 'y' | 'b';

    private constructor(
        url: string,
        dlobj: Durl | DashAudio,
        title: string,
        author: string,
        description: string,
        thumbnail: string,
        rawDuration: number,
        hmsDuration: string,
        initator: GuildMember,
        uid: string,
        ext: string,
        isLive: boolean,
        size: number,
        cached: boolean,
        type: 'y' | 'b') {
        this.url = url;
        this.dlobj = dlobj;
        this.title = title;
        this.author = author;
        this.description = description;
        this.thumbnail = thumbnail;
        this.rawDuration = rawDuration;
        this.hmsDuration = hmsDuration;
        this.initiator = initator;
        this.uid = uid;
        this.format = ext;
        this.isLive = isLive;
        this.size = size;
        this.cached = cached;
        this.type = type;
    }

    /**
     * Parse a YouTube song info entity into a song details record.
     * @param info YouTube song info entity.
     * @param initiator User who initiated the command.
     */
    public static async withInfo(info: ytdl.videoInfo, initiator: GuildMember): Promise<SongInfo> {
        const details = info.videoDetails;
        const format = ytdl.chooseFormat(info.formats, {filter: 'audioonly'});
        const tmbarr = info.videoDetails.thumbnails;
        // tmbarr.sort((a, b) => {
        //     return (a.height + a.width) - (b.height - b.width);
        // });
        const url = details.video_url;
        const isLive = format.isLive;
        const title = details.title;
        const thumbnailUrl = tmbarr[tmbarr.length-1].url;
        const dlurl = {url: format.url, baseUrl: format.url} as Durl;
        const author = details.author.name;
        const description = SongInfo.trim(info.videoDetails.description);
        const uid = details.videoId;
        const ext = format.mimeType.substr(format.mimeType.indexOf("codecs=\"")+8, format.mimeType.length-1);
        const duration = Number(details.lengthSeconds)
        const hms = toHms(duration, isLive);
        const size = Number(format.contentLength);
        const cached = await SongDataSource.getInstance().isCached(uid);
        return new SongInfo(
            url,
            dlurl,
            title,
            author,
            description,
            thumbnailUrl,
            duration,
            hms,
            initiator,
            uid,
            ext,
            isLive,
            size,
            cached,
            'y'
        );
    }


    /**
     * Parse a BiliBili song entity into a song details record.
     * @param songEntity BiliBili song entity.
     * @param initiator User who initiated the command.
     */
    public static async withSongEntity(songEntity: BiliSongEntity, initiator: GuildMember): Promise<SongInfo>{
        const url = songEntity.url;
        const title = songEntity.title;
        const uid = songEntity.uid;
        return new SongInfo(
            url,
            songEntity.dlobj,
            title,
            songEntity.author,
            songEntity.description,
            songEntity.thumbnail,
            songEntity.rawDuration,
            songEntity.hmsDuration,
            initiator,
            uid,
            songEntity.format,
            false,
            songEntity.size,
            songEntity.cached,
            'b'
        );
    }

    public static async withRecord(record: SongDoc, initiator: GuildMember): Promise<SongInfo> {
        // Update video download urls
        return new SongInfo(
            record.url,
            record.dlobj,
            record.title,
            record.author,
            record.description,
            record.thumbnail,
            record.rawDuration,
            record.hmsDuration,
            initiator,
            record.uid,
            record.ext,
            false,
            record.size,
            record.cached,
            record.type
        );
    }

    public static async withUrl(url: string, initiator: GuildMember): Promise<SongInfo> {
        const song = await SongDataSource.getInstance().getByUrl(url);
        if(song) {
            return this.withRecord(song, initiator);
        }
        if(bvidExtract(url)){
            const entity = await getBiliInfo(url).catch((error): BiliSongEntity => {
                logger.error(`Error retrieving song with url ${url}\nError message: ${error}`)
                throw error;
            });
            return SongInfo.withSongEntity(entity, initiator);
        }else if(ytUidExtract(url)){
            const info = await getInfo(url, {});
            return SongInfo.withInfo(info, initiator);
        }else{
            return null;
        }
    }

    public toBiliSongEntity(): BiliSongEntity {
        const bvid = bvidExtract(this.url)[4];
        return new BiliSongEntity()
            .setbvId(bvid)
            .setCid(this.uid)
            .setUrl(this.url)
            .setTitle(this.title)
            .setDesc(this.description)
            .setThumbnail(this.thumbnail)
            .setDurS(this.rawDuration)
            .setDurHms(this.hmsDuration)
            .setAuthor(this.author)
            .setCached(this.cached)
            .setFormat(this.format)
            .setContentLength(this.size)
    }

    private static trim(desc: string): string {
        if(desc.length > 256) {
            return desc.substr(0, 253) + '...';
        }
        return desc;
    }
}
