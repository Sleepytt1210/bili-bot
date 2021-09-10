import {PassThrough, Readable} from 'stream';
import {EventEmitter} from "events";
import miniget = require('miniget');
import {SongInfo} from "../data/model/song-info";
import {Durl} from "../data/model/bilibili-api-types";

export class Streamer extends EventEmitter{

    public constructor() {
        super();

    }

    private createStream (): PassThrough {
        const stream = new PassThrough({
            highWaterMark: 1 << 25
        });
        stream._destroy = (): void => {
            stream.destroyed = true;
        };
        return stream;
    }

    public ytbdl = (info: SongInfo): Readable => {
        const stream = this.createStream();
        this.downloadFromInfoCallback(stream, info);
        return stream;
    };

    private downloadFromInfoCallback = (stream: PassThrough, info: SongInfo): void => {
        const options ={
            range: undefined,
            requestOptions: undefined
        };

        if (!info.format) {
            stream.emit('error', Error('This video is unavailable'));
            return;
        }

        let format: SongInfo;
        try {
            format = info;
        } catch (e) {
            stream.emit('error', e);
            return;
        }
        stream.emit('info', info, format);
        if (stream.destroyed) {
            return;
        }

        // eslint-disable-next-line prefer-const
        let contentLength, downloaded = 0;
        const ondata = (chunk): void => {
            downloaded += chunk.length;
            stream.emit('progress', chunk.length, downloaded, contentLength);
        };

        // Download the file in chunks, in this case the default is 10MB,
        // anything over this will cause youtube to throttle the download
        const dlChunkSize = 1024 * 1024;
        let req;
        let shouldEnd = true;
        const pipeAndSetEvents = (req, stream, end): void => {
            // Forward events from the request to the stream.
            [
                'abort', 'request', 'response', 'error', 'redirect', 'retry', 'reconnect',
            ].forEach((event): void => {
                req.prependListener(event, (arg): void => {
                    stream.emit(event, arg);
                });
            });
            req.pipe(stream, { end: end });
        };

        const requestOptions = Object.assign({}, options.requestOptions, {
            maxReconnects: 6,
            maxRetries: 3,
            backoff: { inc: 500, max: 10000 },
        });

        // Manual req
        let i = 0;
        let start = 0;
        let end = start + dlChunkSize;
        const dlurls = format.dlurls as Durl[];
        const parts = dlurls.length;
        contentLength = format.size;

        const getNextChunk = (): void => {
            const partEnd = Number(dlurls[i].size);
            const nextPart = (end >= partEnd && i < (parts-1) );
            if (end >= contentLength) end = 0;
            if (nextPart) end = partEnd;
            shouldEnd = !end || end === contentLength;

            requestOptions.headers = Object.assign({}, requestOptions.headers, {
                Range: `bytes=${start}-${end || ''}`,
            });

            requestOptions.headers = Object.assign({}, requestOptions.headers, {
                Host: format.dlurls[i]["url"].match(/.*:\/\/(\S+)\/[a-zA-Z]+\/\d+\/\d+\/\d+\/(\S+)\?/)[1],
            });

            req = miniget(format.dlurls[i]["url"], requestOptions);
            req.on('data', ondata);
            req.on('end', (): void => {
                if (stream.destroyed) return;
                if (end <= contentLength) {
                    if(nextPart) {
                        i++;
                        start = 0;
                        end = dlChunkSize;
                    }else {
                        start = end + 1;
                        end += dlChunkSize;
                    }
                    getNextChunk();
                }
            });
            pipeAndSetEvents(req, stream, shouldEnd);
        };
        getNextChunk();

        // req = miniget(format.dlurl, requestOptions);
        // req.on('response', res => {
        //     if (stream['_isDestroyed']) {
        //         return;
        //     }
        //     if (!contentLength) {
        //         contentLength = parseInt(res.headers['content-length'], 10);
        //     }
        // });
        // req.on('data', ondata);
        // pipeAndSetEvents();

        stream._destroy = (): void => {
            stream.destroyed = true;
            req.destroy();
            req.end()
        };
    };
}
