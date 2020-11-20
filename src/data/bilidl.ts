import {PassThrough} from 'stream';
import {EventEmitter} from "events";
import {getBasicInfo, SearchSongEntity} from './datasources/bilibili-api';
import miniget = require('miniget');

export class Streamer extends EventEmitter{

    public constructor() {
        super();

    }

    private createStream (){
        const stream = new PassThrough({
            highWaterMark: 1 << 25
        });
        stream.destroy = () => {
            stream['_isDestroyed'] = true;
        };
        return stream;
    }

    public ytbdl = url => {
        const stream = this.createStream();
        getBasicInfo(url).then((info) => {
            this.downloadFromInfoCallback(stream, info);
        }).catch((error) => {
            console.error(error);
        });
        return stream;
    };

    private downloadFromInfoCallback = (stream: PassThrough, info: SearchSongEntity) => {
        const options ={
            range: undefined,
            requestOptions: undefined
        };

        if (!info.format) {
            stream.emit('error', Error('This video is unavailable'));
            return;
        }

        let format: SearchSongEntity;
        try {
            format = info;
        } catch (e) {
            stream.emit('error', e);
            return;
        }
        stream.emit('info', info, format);
        if (stream['_isDestroyed']) {
            return;
        }

        let contentLength, downloaded = 0;
        const ondata = chunk => {
            downloaded += chunk.length;
            stream.emit('progress', chunk.length, downloaded, contentLength);
        };

        // Download the file in chunks, in this case the default is 10MB,
        // anything over this will cause youtube to throttle the download
        const dlChunkSize = 1024 * 1024;
        let req;
        let shouldEnd = true;
        const pipeAndSetEvents = () => {
            // Forward events from the request to the stream.
            [
                'abort', 'request', 'response', 'error', 'redirect', 'retry', 'reconnect',
            ].forEach(event => {
                req.prependListener(event, arg => {
                    stream.emit(event, arg);
                });
            });
            req.pipe(stream, { end: shouldEnd });
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
        const parts = format.dlurls.length;
        contentLength = format.contentLength;

        const getNextChunk = () => {
            const partEnd = Number(format.dlurls[i]["size"]);
            const nextPart = end >= partEnd && i < parts;
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
            req.on('end', () => {
                if (stream['_isDestroyed']) { return; }
                if (end !== contentLength) {
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
            pipeAndSetEvents();
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

        stream.destroy = () => {
            stream['_isDestroyed'] = true;
            if (req.abort) req.abort();
            req.end();
            req.removeListener('data', ondata);
            req.unpipe();
        };
    };
}