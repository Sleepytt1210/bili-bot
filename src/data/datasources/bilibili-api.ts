import { SongDataSource } from "./song-datasource.js";
import { getLogger } from "../../utils/logger.js";
import fetch, { AbortError, Response } from "node-fetch";
import { AbortController } from "abort-controller";
import { CommandException } from "../../commands/base-command.js";
import Config from "../../configuration.js";
import crypto = require("crypto");
import {
	DashAudio,
	PlayUrlResult,
	Durl,
	Pages,
	PlayUrlData,
	SearchResults,
	WebInterface,
	DashData,
} from "../model/bilibili-api-types.js";
import { KeyPair, RequestConfig } from "./interfaces/bilibili-api.interface.js";
import { BiliApiSessionDataSource } from "./bili-api-session-datasource.js";
import { Cookie, cookieToString } from "../../utils/cookie.js";

const controller = new AbortController();
const timeoutLimit = 10000; // 10s
const SESSION_ID = 1;

const logger = getLogger("BilibiliApi");

const api = {
	liveApi: (rid): string => {
		return `https://api.live.bilibili.com/xlive/web-room/v1/record/getLiveRecordUrl?rid=${rid}&platform=html5`;
	},
	dlApi: (payload, sign, bvid): string => {
		return `https://api.bilibili.com/x/player/playurl?${payload}&sign=${sign}&bvid=${bvid}`;
	},
	webIntApi: (path): string => {
		return `https://api.bilibili.com/x/web-interface/view?${path}`;
	},
	loginApi: (): string => {
		return `https://account.bilibili.com/api/login/v2`;
	},
	pagelistApi: (bvid): string => {
		return `https://api.bilibili.com/x/player/pagelist?bvid=${bvid}&jsonp=jsonp`;
	},
	searchApi: (keyword, limit): string => {
		return `https://api.bilibili.com/x/web-interface/search/type?keyword=${keyword}&page=1&order=totalrank&page_size=${limit}&search_type=video`;
	},
	youtubeApi: (keyword, apiKey): string => {
		return `https://youtube.googleapis.com/youtube/v3/search?part=snippet&maxResults=25&q=${keyword}&key=${apiKey}`;
	},
	getAppKey: (): KeyPair => {
		// AppKey: AppSec pairs, https://github.com/SocialSisterYi/bilibili-API-collect/blob/master/docs/misc/sign/APPKey.md
		const keys = [
			{
				APP_KEY: "27eb53fc9058f8c3",
				APP_SEC: "c2ed53a74eeefe3cf99fbd01d8c9c375",
			},
			{
				APP_KEY: "iVGUTjsxvpLeuDCf",
				APP_SEC: "aHRmhWMLkdeMuILqORnYZocwMBpMEOdt",
			},
			{
				APP_KEY: "4ebafd7c4951b366",
				APP_SEC: "8cb98205e9b2ad3669aad0fce12a4c13",
			},
		];
		return keys[Math.floor(Math.random() * keys.length)];
	},
};

export class BiliSongEntity {
	public title: string;
	public mainTitle: string;
	public aid: string;
	public bvId: string;
	public uid: string;
	public cidList: Pages[];
	public thumbnail: string;
	public description: string;
	public author: string;
	public play: number;
	public size: number;
	public url: string;
	public dlobj: Durl | DashAudio;
	public cached: boolean;
	public format: string;
	public rawDuration: number;
	public hmsDuration: string;
	public type: "b";

	public setTitle(title: string): this {
		this.title = title;
		return this;
	}

	public setMainTitle(mainTitle: string): this {
		this.mainTitle = mainTitle;
		return this;
	}

	public setContentLength(value: number): this {
		this.size = value;
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

	public setCidList(list: Pages[]): this {
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

	public setDlobj(dlobj: Durl | DashAudio): this {
		this.dlobj = dlobj;
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
		this.type = "b";
		return this;
	}

	public getUrl(): string {
		return `https://www.bilibili.com/video/av${this.uid}`;
	}
}

const headers = {
	accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
	"accept-language": "en-US,en;q=0.9",
	"cache-control": "max-age=0",
	"sec-ch-ua": '"Chromium";v="122", "Not(A:Brand";v="24", "Microsoft Edge";v="122"',
	"sec-ch-ua-mobile": "?0",
	"sec-ch-ua-platform": '"Windows"',
	"sec-fetch-dest": "document",
	"sec-fetch-mode": "navigate",
	"sec-fetch-site": "same-origin",
	"sec-fetch-user": "?1",
	"upgrade-insecure-requests": "1",
	Referer: "https://www.bilibili.com/",
	"Referrer-Policy": "no-referrer-when-downgrade",
	"user-Agent":
		"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 Edg/122.0.0.0",
};

const defaultOptions: RequestConfig = {
	headers: headers,
	referer: "https://www.bilibili.com/",
	timeout: 4500,
};

const prepareSession = async () => {
	const basds = BiliApiSessionDataSource.getInstance();
	if (!(await basds.exists(SESSION_ID)) || (await basds.isExpired(SESSION_ID))) {
		logger.info('Updating BiliBili cookies');
		const response = await fetch("https://www.bilibili.com/", {
			headers: {
				accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
				"accept-language": "en-US,en;q=0.9",
				"cache-control": "max-age=0",
				"sec-ch-ua": '"Not A(Brand";v="99", "Microsoft Edge";v="121", "Chromium";v="121"',
				"sec-ch-ua-mobile": "?0",
				"sec-ch-ua-platform": '"Windows"',
				"sec-fetch-dest": "document",
				"sec-fetch-mode": "navigate",
				"sec-fetch-site": "none",
				"sec-fetch-user": "?1",
				"upgrade-insecure-requests": "1",
			},
			referrerPolicy: "strict-origin-when-cross-origin",
			body: null,
			method: "GET",
		});

		const cookies = response.headers.raw()["set-cookie"].map((cookie) => Cookie.from(cookie));
		await basds.updateCookies(SESSION_ID, cookies);
		logger.info("Updated BiliBili Cookies");
	}

	return await basds.getCookieOf(SESSION_ID);
};

const baseRequest = async (url: string, options: RequestConfig): Promise<Response> => {
	const cookies = await prepareSession();
	defaultOptions.headers.referer = options.referer ? options.referer : headers.Referer;
	defaultOptions.headers["cookie"] = cookies.map((cookie) => cookieToString(cookie)).join(", ");

	const appliedOptions = {
		...defaultOptions,
		...options,
	};

	const timeout = setTimeout(() => {
		controller.abort();
	}, appliedOptions.timeout);

	try {
		return await fetch(url, {
			method: "get",
			headers: appliedOptions.headers,
			referrer: appliedOptions.referer,
			signal: controller.signal,
		});
	} catch (e) {
		if (e instanceof AbortError) {
			logger.error(`${e.toString()} - Timeout retrieving data from ${url}`);
			throw new CommandException(true, "Timeout processing request");
		}
		logger.error(`${e.toString()} - Error retrieving from ${url}`);
		throw e;
	} finally {
		clearTimeout(timeout);
	}
};

const jsonRequest = async (url: string, options: RequestConfig): Promise<any> => {
	return (await baseRequest(url, options)).json();
};

export function formatToValue(format): string {
	if (format == "does_not_exist") throw `formatToValue: cannot lookup does_not_exist`;
	const dict = {
		hdflv2: "120",
		flv_p60: "116",
		flv720_p60: "74",
		flv: "80",
		flv720: "64",
		flv480: "32",
		flv360: "15",

		// legacy - late 2017
		hdmp4: "64", // data-value is still '64' instead of '48'.  '48',
		mp4: "16",
		"30280": "192k",
		"30232": "132k",
		"30216": "64k",
		"30250": "dolby",
		"30251": "high-res",
	};
	return dict[format] || null;
}

export function bvidExtract(url: string): string[] {
	return url.match(/(^(https?:\/\/)?([a-z]+\.)?bilibili\.com\/\S*\/?(BV\w+|av\d+)(\?p=(\d+))?)|(b23\.tv\/(\w+))/);
}

export function toHms(seconds: number, isLive?: boolean): string {
	if (isLive) return "♾️ LIVE";

	const hours = Math.floor(seconds / 3600);
	const minutes = Math.floor((seconds - hours * 3600) / 60);
	const secs = seconds - hours * 3600 - minutes * 60;
	let res = String();

	res += hours < 10 ? "0" + hours : String(hours);
	res += ":";
	res += minutes < 10 ? "0" + minutes : String(minutes);
	res += ":";
	res += secs < 10 ? "0" + secs : String(secs);
	return res;
}

export async function getExtraInfo(info: BiliSongEntity): Promise<BiliSongEntity> {
	const keyPair = api.getAppKey();
	const payload = `appkey=${keyPair.APP_KEY}&cid=${info.uid}&otype=json&qn=80&fnval=16&fnver=0`;
	const sign = crypto
		.createHash("md5")
		.update(payload + keyPair.APP_SEC)
		.digest("hex");
	const dlapi = api.dlApi(payload, sign, info.bvId);
	let data: PlayUrlResult;
	logger.info(`Fetching video data from ${dlapi}`);
	try {
		data = await jsonRequest(dlapi, { referer: info.url, timeout: 5000 });
	} catch (error) {
		console.dir(data);
		logger.error(`Error fetching data from ${dlapi}: ${error}`);
		throw error;
	}
	let dlobj: Durl | DashAudio, format: string, contentLength: number;
	if (data.data["dash"]) {
		const res: DashData = data.data as DashData;
		dlobj = res.dash.audio[0];
		format = res.format;
		contentLength = Number((await fetch(dlobj.baseUrl, { headers: headers })).headers.get("content-length"));
	} else if (data.data["durl"]) {
		const res: PlayUrlData = data.data as PlayUrlData;
		res.durl = res.durl.map((obj) => {
			obj.baseUrl = obj.url;
			return obj;
		});
		dlobj = res.durl[0];
		format = res.format;
		contentLength = dlobj.size;
	}
	logger.info(`Successfully fetched video data from  ${dlapi}`);
	return info.setDlobj(dlobj).setFormat(format).setContentLength(contentLength);
}

export async function getBiliInfo(url: string): Promise<BiliSongEntity> {
	const fullId = bvidExtract(url);
	let id: string;
	if (fullId[7]) {
		if (fullId[8] && fullId[8].match(/(BV\w+|av\d+)/)) id = fullId[0].match(/(BV\w+|av\d+)/)[1];
		else if (fullId[8]) {
			const resp = await baseRequest(`https://${fullId[7]}`, { timeout: 5000 });
			const newurl = resp.headers["location"];
			if (newurl == null) throw CommandException.UserPresentable(`Invalid bilibili url!`);
			id = newurl.match(/(BV\w+|av\d+)/)[1];
		} else {
			throw CommandException.UserPresentable(`Invalid bilibili url!`);
		}
	} else {
		id = fullId[4];
	}
	const path = id.startsWith("BV") ? `bvid=${id}` : `aid=${id.substr(2)}`;
	const pg = fullId[6] ? parseInt(fullId[6]) : 1;
	const cidapi = api.webIntApi(path);
	const weburl = `https://www.bilibili.com/video/${id}?p=${pg}`;
	let response: any;
	logger.info(`Fetching webpage ${cidapi} with referrer: ${weburl}`);
	try {
		response = await jsonRequest(cidapi, { referer: weburl });
	} catch (error) {
		console.dir(response);
		logger.error(`Error fetching data from ${cidapi}: ${error}`);
		throw error;
	}
	logger.info(`Successfully fetched data from web interface ${cidapi}`);
	const rawData = response["data"] as WebInterface;
	if (pg > rawData.pages.length) {
		throw CommandException.UserPresentable(`URL parameter p=${pg} out of bound! Please check again!`);
	}
	const rawCids = rawData.pages;
	const mainTitle = rawData.title;
	const desc = rawData.desc;
	const aid = rawData.aid;
	const bvid = rawData.bvid;
	const play = rawData.stat.view;
	const thumbnail = rawData.pic;
	const cid = rawCids[pg - 1].cid;
	const author = rawData.owner.name;
	const duration = rawCids[pg - 1].duration;
	const accHms = toHms(duration);
	const title = rawCids.length > 1 ? rawCids[pg - 1].part : rawData.title;
	const cached = await SongDataSource.getInstance().isCached(cid);
	return getExtraInfo(
		new BiliSongEntity()
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

export async function search(keyword: string, limit?: number): Promise<BiliSongEntity[]> {
	if (!limit) limit = 20;
	const keyWExt = new RegExp(/<([A-Za-z][A-Za-z0-9]*)\b[^>]*>(.*?)<\/\1>/gm);
	const encoded = encodeURI(api.searchApi(keyword, limit));
	logger.info(`Searching for keyword :${keyword} with url ${encoded}`);
	const encodedKeyword = encodeURI(keyword.replace(" ", "+"));
	const response = await jsonRequest(encoded, {
		referer: `https://search.bilibili.com/video?keyword=${encodedKeyword}&from_source=webtop_search&spm_id_from=333.1007&search_source=3`,
		timeout: 5000,
	});
	logger.info(`Retrieved results from searching keyword ${keyword}`);
	const rawSongs = response["data"]["result"] as SearchResults[];
	if (!rawSongs) return [];
	return rawSongs.map((raw): BiliSongEntity => {
		let title = raw.title;
		title = title.replace(keyWExt, "$2");
		return new BiliSongEntity()
			.setTitle(title)
			.setAuthor(raw.author)
			.setAid(raw.aid)
			.setPlay(raw.play)
			.setUrl(`https://www.bilibili.com/video/${raw.bvid}`)
			.setCached(false)
			.setDesc(raw.description)
			.setThumbnail(raw.pic)
			.setDurHms(raw.duration)
			.setbvId(raw.bvid);
	});
}

export const ytSearch = async (keyword: string): Promise<string> => {
	const searchApi = api.youtubeApi(keyword, Config.getYTApiKey());
	const url = encodeURI(searchApi);
	const resp = await jsonRequest(url, {});
	if (resp["items"].length === 0) return null;
	return `https://www.youtube.com/watch?v=${resp["items"][0]["id"]["videoId"]}`;
};

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
