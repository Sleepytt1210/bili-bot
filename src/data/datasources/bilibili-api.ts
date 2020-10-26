import * as request from "request-promise";
import RandomMapping from '../../const/random-mapping';
import {SongDataSource} from "./song-datasource";
import {getLogger} from "../../utils/logger";
import fetch from "node-fetch"
import {CommandException} from "../../commands/base-command";
import crypto = require("crypto");
import configuration from "../../configuration";


const logger = getLogger('BilibiliApi');
// const apiBaseUrl = "https://api.imjad.cn/bilibili/v2/";
const api = {
    liveApi: (rid): string => {
        return `https://api.live.bilibili.com/xlive/web-room/v1/record/getLiveRecordUrl?rid=${rid}&platform=html5`
    },
    dlApi: (payload, sign): string => {
        return `http://interface.bilibili.com/v2/playurl?${payload}&sign=${sign}`
    },
    webIntApi: (path): string => {
        return `https://api.bilibili.com/x/web-interface/view?${path}`
    },
    loginApi: (): string => {
        return `https://account.bilibili.com/api/login/v2`
    },
    searchApi: (keyword, limit): string => {
        return `https://api.bilibili.com/x/web-interface/search/all/v2?keyword=${keyword}&page=1&order=totalrank&pagesize=${limit}&search_type=video`
    },
    _APP_KEY: 'iVGUTjsxvpLeuDCf',
    _BILIBILI_KEY: 'aHRmhWMLkdeMuILqORnYZocwMBpMEOdt'
}

export class SearchSongEntity {
    public title: string;
    public mainTitle: string;
    public aid: string;
    public bvId: string;
    public uid: string;
    public cidList: string[];
    public thumbnail: string;
    public description: string;
    public author: string;
    public play: number;
    public contentLength: number;
    public url: string;
    public dlurl: string;
    public cached: boolean;
    public format: string;
    public rawDuration: number;
    public hmsDuration: string;
    public type: 'b';

    public setTitle(title: string): this {
        this.title = title;
        return this;
    }

    public setMainTitle(mainTitle: string): this {
        this.mainTitle = mainTitle;
        return this;
    }

    public setContentLength(value: number): this {
        this.contentLength = value;
        return this;
    }

    public setbvId(id: string): this {
        this.bvId = id;
        return this;
    }

    public setDesc(desc: string): this {
        this.description = desc;
        return this;
    }

    public setThumbnail(tb: string): this {
        this.thumbnail = tb;
        return this;
    }

    public setCidList(list: string[]): this {
        this.cidList = list;
        return this;
    }

    public setCid(id: string): this {
        this.uid = id;
        return this;
    }

    public setAid(aid: string): this {
        this.aid = aid;
        return this;
    }

    public setAuthor(author: string): this {
        this.author = author;
        return this;
    }

    public setPlay(play: number): this {
        this.play = play;
        return this;
    }

    public setUrl(url: string): this {
        this.url = url;
        return this;
    }

    public setDlurl(dlurl: string): this {
        this.dlurl = dlurl;
        return this;
    }

    public setCached(cached: boolean): this {
        this.cached = cached;
        return this;
    }

    public setDurS(secs: number): this {
        this.rawDuration = secs;
        return this;
    }

    public setDurHms(hms: string): this {
        this.hmsDuration = hms;
        return this;
    }

    public setFormat(format: string): this {
        this.format = format;
        return this;
    }

    public setType(): this {
        this.type = 'b';
        return this;
    }

    public getUrl(): string {
        return `https://www.bilibili.com/video/av${this.uid}`;
    }
}

export function formatToValue(format): string {
    if (format == 'does_not_exist') throw `formatToValue: cannot lookup does_not_exist`;
    const dict = {
        'hdflv2': '120',
        'flv_p60': '116',
        'flv720_p60': '74',
        'flv': '80',
        'flv720': '64',
        'flv480': '32',
        'flv360': '15',

        // legacy - late 2017
        'hdmp4': '64', // data-value is still '64' instead of '48'.  '48',
        'mp4': '16',
    }
    return dict[format] || null;
}

export async function getExtraInfo(info: SearchSongEntity): Promise<SearchSongEntity> {
    const payload = `appkey=${api._APP_KEY}&cid=${info.uid}&otype=json&qn=80`
    const sign = crypto.createHash('md5').update(Buffer.from(payload + api._BILIBILI_KEY).toString('utf-8')).digest('hex');
    const dlapi = api.dlApi(payload, sign);
    const re = await fetch(dlapi, {
        headers: {
            'Referer': info.url,
        }
    });
    const data = await re.json();
    //console.log(apiJson);
    const dllink = data['durl']['0']['url'];
    const format = formatToValue(data['format'] as string);
    return info
        .setDlurl(dllink)
        .setFormat(format)
        .setContentLength(data['durl']['0']['size']);
}

export function bvidExtract(url: string): string[] {
    return url.match(/(^(https?:\/\/)?([a-z]+\.)?bilibili\.com\/\S*\/?(BV\w+|av\d+)(\?p=(\d+))?)|(b23\.tv\/(\w+))/);
}

export function toHms(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds - (hours * 3600)) / 60);
    const secs = seconds - (hours * 3600) - (minutes * 60);
    let res = String();

    res += (hours < 10) ? "0" + hours : String(hours);
    res += ":";
    res += (minutes < 10) ? "0" + minutes : String(minutes);
    res += ":";
    res += (secs < 10) ? "0" + secs : String(secs)
    return res;
}

export async function getBasicInfo(url: string): Promise<SearchSongEntity> {
    const fullId = await bvidExtract(url);
    let id;
    if (fullId[7]) {
        if (fullId[8] && fullId[8].match(/(BV\w+|av\d+)/)) id = fullId[0].match(/(BV\w+|av\d+)/)[1];
        else if (fullId[8]) {
            const resp = await fetch(`https://${fullId[7]}`, {
                method: "GET",
                redirect: 'manual'
            });
            const newurl = await resp.headers.get('location');
            if (newurl == null) throw CommandException.UserPresentable(`Invalid bilibili url!`);
            id = newurl.match(/(BV\w+|av\d+)/)[1];
        } else {
            throw CommandException.UserPresentable(`Invalid bilibili url!`);
        }
    } else {
        id = fullId[4];
    }
    const path = (id.startsWith("BV") ? `bvid=${id}` : `aid=${id.substr(2)}`);
    const pg = fullId[6] ? parseInt(fullId[6]) : 1;
    const cidapi = api.webIntApi(path);
    const opt = {
        url: cidapi,
        json: true
    }
    const weburl = `https://www.bilibili.com/video/${id}?p=${pg}`
    const response = await request(opt);
    const rawData = response['data'];
    const rawCids = rawData['pages'] as string[];
    const mainTitle = rawData['title'];
    const desc = rawData['desc'];
    const aid = rawData['aid'];
    const bvid = rawData['bvid'];
    const play = rawData['stat']['view'];
    const thumbnail = rawData['pic'];
    const cid = rawCids[pg - 1]['cid'];
    const author = rawData['owner']['name'];
    const duration = rawCids[pg - 1]['duration'];
    const accHms = toHms(duration);
    const title = (rawCids.length > 1) ? rawCids[pg - 1]['part'] : rawData['title'];
    const cached = await SongDataSource.getInstance().isCached(cid);
    return getExtraInfo(new SearchSongEntity()
        .setCid(cid)
        .setTitle(title)
        .setMainTitle(mainTitle)
        .setCidList(rawCids)
        .setAid(aid)
        .setbvId(bvid)
        .setAuthor(author)
        .setDurS(duration)
        .setDurHms(accHms)
        .setThumbnail(thumbnail)
        .setDesc(desc)
        .setCached(cached)
        .setUrl(weburl)
        .setPlay(play)
        .setType()
    );
}

export async function search(keyword: string, limit?: number): Promise<SearchSongEntity[]> {
    if (!limit) limit = 20;
    const keyWExt = new RegExp(/<([A-Za-z][A-Za-z0-9]*)\b[^>]*>(.*?)<\/\1>/gm);
    const encoded = encodeURI(api.searchApi(keyword, limit));
    const re = await fetch(encoded);
    const response = await re.json();
    const rawSongs = response['data']['result'][8]['data'] as object[];
    if (!rawSongs) return [];
    return rawSongs.map((raw): SearchSongEntity => {
        let title = raw['title'] as string;
        title = title.replace(keyWExt, '$2');
        return new SearchSongEntity()
            .setTitle(title)
            .setAuthor(raw['author'])
            .setAid(raw['aid'])
            .setCid(raw['param'])
            .setPlay(raw['play'])
            .setUrl(`https://www.bilibili.com/video/${raw['bvid']}`)
            .setCached(false)
            .setDesc(raw[`description`])
            .setThumbnail(raw[`pic`])
            .setDurHms(raw[`duration`])
            .setbvId(raw['bvId']);
    });
}

export const ytSearch = async (keyword: string): Promise<string> => {
    const api = `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=5&order=relevance&q=${keyword}&type=video&key=${configuration.getYTApiKey()}`;
    const url = encodeURI(api);
    const resp = await fetch(url, {
        method: 'GET', headers: {
            'Accept': 'application/json',
            'User-Agent': 'Mozilla/5.0 (compatible; Discordbot/2.0; +https://discordapp.com)'
        }
    });
    const js = await resp.json();
    if(js['items'].length === 0) return null;
    return `https://www.youtube.com/watch?v=${js['items'][0]['id']['videoId']}`;
}

// export async function randomRanking(
//     catagory: string,
//     type: string,
// ): Promise<SearchSongEntity> {
//     const content = RandomMapping[catagory] || 1;
//     const params = {
//         get: "rank",
//         type,
//         content,
//     };
//
//     const req = {
//         uri: apiBaseUrl,
//         qs: params,
//         json: true
//     };
//
//     const response = await request(req);
//     const rawSongs = response['rank']['list'];
//     const randomIndex = Math.floor(Math.random() * rawSongs.length);
//     const raw = rawSongs[randomIndex];
//     logger.info(`Random result av${raw["aid"]} selected from Bilibili`);
//     return new SearchSongEntity()
//         .setTitle(raw['title'])
//         .setAuthor(raw['author'])
//         .setCid(raw['param'])
//         .setPlay(raw['play'])
//         .setUrl(`https://www.bilibili.com/video/av${raw['param']}`)
//         .setDlurl(`https://www.bilibili.com/video/av${raw['param']}`)
//         .setCached(false)
//         .setDesc(raw[`desc`])
//         .setThumbnail(raw[`cover`])
//         .setDurHms(raw[`duration`]);
// }
