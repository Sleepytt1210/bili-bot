import * as Promise from 'bluebird';
import * as youtubedl from "youtube-dl";
import {Info} from "youtube-dl";
import {MessageEmbed} from "discord.js";
import * as ytdl from "ytdl-core";

export const getInfo = ytdl.getInfo;

export const getInfoWithArg = Promise.promisify(
    (url: string, arg: string[], cb: (err: Error, info: Info) => void): void => youtubedl.getInfo(url, arg, cb)
);

export const ytUidExtract = (url: string): string => {
    // youtube
    // https://stackoverflow.com/questions/3452546/how-do-i-get-the-youtube-video-id-from-a-url
    // Author: tsdorsey
    const re = /^(https?:\/\/)?(([a-z]+\.)?(youtube(-nocookie)?|youtube.googleapis)\.com.*(v\/|v=|vi=|vi\/|e\/|embed\/|user\/.*\/u\/\d+\/)|youtu\.be\/)([_0-9a-z-]+)/i;
    const match = url.match(re);
    return match ? match[7] : null;
};

export const ytPlIdExtract = (url: string): string => {
    const re = /^(https?:\/\/)?(([a-z]+\.)?(youtube(-nocookie)?|youtube.googleapis)\.com.*(playlist\?)?|youtu\.be\/)list=([_0-9a-z-]+)/i;
    const match = url.match(re);
    return match ? match[7] : null;
}

export const shuffle = <T>(array: T[]): void => {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
};

export const helpTemplate = (type: string): MessageEmbed => {
    const embed = new MessageEmbed();
    embed.setTitle(`**${type.toUpperCase()}**`)
        .setColor(0x0ACDFF)
    return embed;
}

export const isNum = (num: string): boolean => {
    return num != null && !isNaN(Number(num)) && Number.isInteger(Number(num));
}
