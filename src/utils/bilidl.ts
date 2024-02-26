import { SongInfo } from "../data/model/song-info.js";
import { DashAudio, Durl } from "../data/model/bilibili-api-types.js";
import { getLogger } from "./logger.js";
import { StreamType } from "@discordjs/voice";
import pm from "prism-media";
import { Readable } from "stream";
import Miniget from "miniget";
import { get } from "http";
import { getExtraInfo } from "../data/datasources/bilibili-api.js";

const { FFmpeg } = pm;

const headers = {
	Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
	"Accept-Encoding": "gzip, deflate, br",
	"Accept-Language": "en-US,en;q=0.9",
	"Cache-Control": "max-age=0",
	Connection: "keep-alive",
	"Sec-Ch-Ua": '"Not_A Brand";v="8", "Chromium";v="120", "Microsoft Edge";v="120"',
	"Sec-Ch-Ua-Mobile": "?0",
	"Sec-Ch-Ua-Platform": "Windows",
	"Sec-Fetch-Dest": "document",
	"Sec-Fetch-Mode": "navigate",
	"Sec-Fetch-Site": "none",
	"Sec-Fetch-User": "?1",
	"Upgrade-Insecure-Requests": "1",
	"User-Agent":
		"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 Edg/122.0.0.0",
};

interface StreamOptions {
	seek?: number;
	ffmpegArgs?: string[];
	isLive?: boolean;
	type?: StreamType;
}

const logger = getLogger("BiliBili-DL");

export class Streamer {
	type: StreamType;
	stream: pm.FFmpeg;
	url: string;

	private async newStream(songInfo: SongInfo, options: StreamOptions): Promise<Streamer> {
		var dlobj = songInfo.dlobj;

		/**
		 * Stream URL
		 * @type {string}
		 */
		if (!dlobj?.baseUrl) throw new Error("This video is unavailable!");

		// Test the base url
		logger.info(`Fetching ${dlobj.baseUrl}`);
		try {
			const resp = await fetch(dlobj.baseUrl, {
				method: "get",
				headers: headers,
			});

			// If failed to get baseUrl, or content is not a video
			if (
				resp.status != 200 ||
				!resp?.headers["content-type"].startsWith("video") ||
				!resp?.headers["content-type"].startsWith("audio")
			) {
				logger.info("Invalid resource url, attempting to retrieve a new resource url!");
				dlobj = (await getExtraInfo(songInfo.toBiliSongEntity())).dlobj;
			}
		} finally {
			this.url = dlobj.baseUrl;
			/**
			 * Stream type
			 * @type {DiscordVoice.StreamType}
			 */
			this.type = !options.type ? StreamType.OggOpus : StreamType.Raw;
			const args = [
				"-reconnect",
				"1",
				"-reconnect_streamed",
				"1",
				"-reconnect_delay_max",
				"5",
				"-i",
				dlobj.baseUrl,
				"-analyzeduration",
				"0",
				"-loglevel",
				"0",
				"-ar",
				"48000",
				"-ac",
				"2",
				"-f",
			];
			if (!options.type) {
				args.push("opus", "-acodec", "libopus");
			} else {
				args.push("s16le");
			}
			if (typeof options.seek === "number" && options.seek > 0) {
				args.unshift("-ss", options.seek.toString());
			}
			if (Array.isArray(options.ffmpegArgs)) {
				args.push(...options.ffmpegArgs);
			}
			/**
			 * FFmpeg stream
			 * @type {FFmpeg}
			 */
			this.stream = new FFmpeg({ args, shell: false });
			logger.info(`Created FFmpeg stream with command ffmpeg ${args.join(" ")}`);
			(<any>this.stream)._readableState && ((<any>this.stream)._readableState.highWaterMark = 1 << 25);
			return this;
		}
	}

	static async createStream(info: SongInfo): Promise<Readable> {
		logger.info(`Start to stream ${info.title}`);
		return (await new Streamer().newStream(info, {})).stream;
	}
}
