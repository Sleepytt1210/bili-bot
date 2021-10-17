import youtubedl, {YtResponse} from "youtube-dl-exec";
import {MessageEmbed} from "discord.js";
import ytdl from "ytdl-core";
import {BaseCommand} from "../commands/base-command";

export const getInfo = ytdl.getInfo;

export const getInfoWithArg = (url: string, args: object): Promise<YtResponse> => youtubedl(url, args);

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

export const helpTemplate = (command: BaseCommand): MessageEmbed => {
    const embed = new MessageEmbed();
    embed.setTitle(`**${command.name().toUpperCase()}**`)
        .setColor(0x0ACDFF)
    if(command.alias && command.alias.length > 0) {
        const aliases = command.alias.join(', ');
        embed.addField('Alias', aliases)
    }
    return embed;
}

export const isNum = (num: string): boolean => {
    return num != null && !isNaN(Number(num)) && Number.isInteger(Number(num));
}
