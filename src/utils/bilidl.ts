import {SongInfo} from "../data/model/song-info.js";
import {DashAudio, Durl} from "../data/model/bilibili-api-types.js";
import { getLogger } from './logger.js';
import { StreamType } from '@discordjs/voice';
import pm from 'prism-media';
import { Readable } from "stream";

const { FFmpeg } = pm;

interface StreamOptions {
    seek?: number;
    ffmpegArgs?: string[];
    isLive?: boolean;
    type?: StreamType;
}

const logger = getLogger('BiliBili-DL');

export class Streamer{

    type: StreamType;
    stream: pm.FFmpeg;
    url: string;

    constructor(dlurl: Durl | DashAudio, options: StreamOptions) {
        /**
         * Stream URL
         * @type {string}
         */
        if(!dlurl || !dlurl.baseUrl) throw new Error("This video is unavailable!");
        
        this.url = dlurl.baseUrl;
        /**
         * Stream type
         * @type {DiscordVoice.StreamType}
         */
        this.type = !options.type ? StreamType.OggOpus : StreamType.Raw;
        console.log(`Download url: ${this.url}`)
        const args = [
          "-reconnect",
          "1",
          "-reconnect_streamed",
          "1",
          "-reconnect_delay_max",
          "5",
          "-i",
          dlurl.baseUrl,
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
        (<any>this.stream)._readableState && ((<any>this.stream)._readableState.highWaterMark = 1 << 25);
      }

    static createStream (info: SongInfo): Readable {
        logger.info(`Start to stream ${info.title}`);
        return new Streamer(info.dlobj, {}).stream;
    }
    
}
