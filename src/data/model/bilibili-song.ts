import {User} from "discord.js";
import {getInfo, ytUidExtract} from "../../utils/utils";
import {SongDataSource} from "../datasources/song-datasource";
import {SongDoc} from "../db/schemas/song";
import {SearchSongEntity, getBasicInfo, bvidExtract, toHms} from "../datasources/bilibili-api";
import * as ytdl from "ytdl-core";
import {CommandException} from "../../commands/base-command";

export class BilibiliSong {
    public readonly url: string;
    public readonly dlurls: object[];
    public readonly title: string;
    public readonly author: string;
    public readonly description: string;
    public readonly thumbnail: string;
    public readonly rawDuration: number;
    public readonly hmsDuration: string;
    public readonly initiator: User;
    public readonly uid: string;
    public readonly format: string;
    public readonly cached: boolean;
    public readonly type: 'y' | 'b';

    private constructor(
        url: string,
        dlurls: object[],
        title: string,
        author: string,
        description: string,
        thumbnail: string,
        rawDuration: number,
        hmsDuration: string,
        initator: User,
        uid: string,
        ext: string,
        cached: boolean,
        type: 'y' | 'b') {
        this.url = url;
        this.dlurls = dlurls;
        this.title = title;
        this.author = author;
        this.description = description;
        this.thumbnail = thumbnail;
        this.rawDuration = rawDuration;
        this.hmsDuration = hmsDuration;
        this.initiator = initator;
        this.uid = uid;
        this.format = ext;
        this.cached = cached;
        this.type = type;
    }

    public static async withInfo(info: ytdl.videoInfo, initiator: User): Promise<BilibiliSong> {
        const details = info.videoDetails;
        const format = ytdl.chooseFormat(info.formats, {filter: 'audioonly'});
        const tmbarr = info.videoDetails.thumbnail.thumbnails;
        // tmbarr.sort((a, b) => {
        //     return (a.height + a.width) - (b.height - b.width);
        // });
        const url = details.video_url;
        const title = details.title;
        const thumbnailUrl = tmbarr[tmbarr.length-1].url;
        const dlurl = [{url: format.url}];
        const author = details.author.name;
        const description = info.videoDetails.shortDescription;
        const uid = details.videoId;
        const ext = format.mimeType.substr(format.mimeType.indexOf("codecs=\"")+8, format.mimeType.length-1);
        const duration = Number(details.lengthSeconds)
        const hms = toHms(duration);
        const cached = await SongDataSource.getInstance().isCached(uid);
        return new BilibiliSong(
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
            cached,
            'y'
        );
    }

    public static async withSongEntity(songEntity: SearchSongEntity, initiator: User): Promise<BilibiliSong>{
        const url = songEntity.url;
        const title = songEntity.title;
        const uid = songEntity.uid;
        return new BilibiliSong(
            url,
            songEntity.dlurls,
            title,
            songEntity.author,
            songEntity.description,
            songEntity.thumbnail,
            songEntity.rawDuration,
            songEntity.hmsDuration,
            initiator,
            uid,
            songEntity.format,
            songEntity.cached,
            'b'
        );
    }

    public static withRecord(record: SongDoc, initiator: User): BilibiliSong {
        return new BilibiliSong(
            record.url,
            record.dlurls,
            record.title,
            record.author,
            record.description,
            record.thumbnail,
            record.rawDuration,
            record.hmsDuration,
            initiator,
            record.uid,
            record.ext,
            record.cached,
            record.type
        );
    }

    public static async withUrl(url: string, Initiator: User): Promise<BilibiliSong> {
        if(bvidExtract(url)){
            const entity = await getBasicInfo(url).catch((error) => {
                throw error;
            });
            return BilibiliSong.withSongEntity(entity, Initiator);
        }else if(ytUidExtract(url)){
            const info = await getInfo(url, {});
            return BilibiliSong.withInfo(info, Initiator);
        }else{
            return null;
        }
    }
}
