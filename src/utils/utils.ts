import youtubeDl from "youtube-dl-exec";
import {EmbedField, EmbedBuilder, EmbedFooterOptions, GuildMember, StringSelectMenuOptionBuilder, StringSelectMenuBuilder, ActionRowBuilder, ChatInputCommandInteraction, Interaction, ComponentType, StringSelectMenuInteraction} from "discord.js";
import ytdl from "ytdl-core";
import {BaseCommand, CommandException} from "../commands/base-command.js";
import { getLogger } from "./logger.js";
import { PlaylistDoc } from "data/db/schemas/playlist.js";
import { PlaylistDataSource } from "data/datasources/playlist-datasource.js";

export const biliblue = 0x0ACDFF;
const logger = getLogger("utils");

/**
 * Api Tools
 */


type YtFormat = {
    asr: number,
    filesize: number,
    format_id: string,
    format_note: string,
    fps: number,
    height: number,
    quality: number,
    tbr: number,
    vbr?: number,
    url: string,
      manifest_url: string,
    width: number,
    ext: string,
    vcodec: string,
    acodec: string,
    abr: number,
    downloader_options: unknown,
    container: string,
    format: string,
    protocol: string,
    http_headers: unknown
}

type YtThumbnail = {
    height: number,
    url: string,
    width: number,
    resolution: string,
    id: string,
}

type YtResponse = {
    id: string,
    title: string,
    formats: YtFormat[],
    thumbnails: YtThumbnail[],
    description: string,
    upload_date: string,
    uploader: string,
    uploader_id: string,
    uploader_url: string,
    channel_id: string,
    channel_url: string,
    duration: number,
    view_count: number,
    average_rating: number,
    age_limit: number,
    webpage_url: string,
    categories: string[],
    tags: string[],
    is_live: boolean,
    like_count: number,
    dislike_count: number,
    channel: string,
    track: string,
    artist: string,
    creator: string,
    alt_title: string,
    extractor: string,
    webpage_url_basename: string,
    extractor_key: string,
    playlist: string,
    playlist_index: number,
    thumbnail: string,
    display_id: string,
    requested_subtitles: unknown,
    asr: number,
    filesize: number,
    format_id: string,
    format_note: string,
    fps: number,
    height: number,
    quality: number,
    tbr: number,
    url: string,
    width: number,
    ext: string,
    vcodec: string,
    acodec: string,
    abr: number,
    downloader_options: { http_chunk_size: number },
    container: string,
    format: string,
    protocol: string,
    http_headers: unknown,
    fulltitle: string,
    _filename: string
}

export const getInfo = ytdl.getInfo;

export const getInfoWithArg = (url: string, args: object): Promise<YtResponse> => youtubeDl(url, args);

export const ytUidExtract = (url: string): string | null => {
    // youtube
    // https://stackoverflow.com/questions/3452546/how-do-i-get-the-youtube-video-id-from-a-url
    // Author: tsdorsey
    const re = /^(https?:\/\/)?(([a-z]+\.)?(youtube(-nocookie)?|youtube.googleapis)\.com.*(v\/|v=|vi=|vi\/|e\/|embed\/|user\/.*\/u\/\d+\/)|youtu\.be\/)([_0-9a-z-]+)/i;
    const match = url.match(re);
    return match ? match[7] : null;
};

export const ytPlIdExtract = (url: string): string | null => {
    const re = /^(https?:\/\/)?(([a-z]+\.)?(youtube(-nocookie)?|youtube.googleapis)\.com.*(playlist\?)?|youtu\.be\/)list=([_0-9a-z-]+)/i;
    const match = url.match(re);
    return match ? match[7] : null;
}

/**
 * Misc
 */

export const shuffle = <T>(array: T[]): void => {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
};

export const isNum = (num: string): boolean => {
    return num != null && !isNaN(Number(num)) && Number.isInteger(Number(num));
}

/**
 * Help Menu Generator
 */

export const helpTemplate = (command: BaseCommand): EmbedBuilder => {
    const embed = new EmbedBuilder();
    embed.setTitle(`**${command.name.toUpperCase()}**`)
        .setColor(biliblue)
    if(command.alias && command.alias.length > 0) {
        const aliases = command.alias.join(', ');
        embed.addFields({name: 'Alias', value: aliases})
    }
    return embed;
}

/**
 * Flip page embeds utilities
 */

export interface EmbedOptions {
    embedTitle: string;
    start: number;
    mapFunc: (start: number) => ((entity: any, index: number) => string);
    embedFooter: EmbedFooterOptions;
    list: object[];
    delim?: string;
    fields?: EmbedField[];
    ifEmpty?: string;
}

export const generateEmbed = (embedOptions: EmbedOptions): EmbedBuilder => {
    const songs = embedOptions.list;
    const start = embedOptions.start;
    const delim = embedOptions.delim ? embedOptions.delim : ( embedOptions.delim !== undefined && embedOptions.delim !== null ? embedOptions.delim : '\n');
    const end = songs.length < 10 ? songs.length : start + 10;
    const current = songs.slice(start, end);

    const embed = new EmbedBuilder()
        .setTitle(embedOptions.embedTitle)
        .setColor(biliblue);
    try{
        if(embedOptions.embedFooter.text || embedOptions.embedFooter.iconURL) embed.setFooter(embedOptions.embedFooter);
        if(embedOptions.fields) embed.addFields(embedOptions.fields);
        const resultMessage = current.length > 0 ? current.map(embedOptions.mapFunc(start)) : [embedOptions.ifEmpty || "Empty!"];
        embed.setDescription(resultMessage.join(delim));
    }catch(error){
        logger.error(`Error occured while setting embed flip pages: ${error}`)
    }
    return embed;
}

export const playlistSelector = async (member: GuildMember, interaction: ChatInputCommandInteraction): Promise<PlaylistDoc> => {
    const playlistsDocs = await (PlaylistDataSource.getInstance()).getAll(member.user)
        const playlistOptions = playlistsDocs.map((playlistDoc, idx) => {
            return new StringSelectMenuOptionBuilder().setDefault(playlistDoc.default).setLabel(playlistDoc.name).setValue(String(idx))
        });

        const playlistMenu = new StringSelectMenuBuilder()
			.setCustomId('playlists')
            .addOptions(...playlistOptions)
			.setPlaceholder('Select a playlist.')
			.setMaxValues(1);

		const row1 = new ActionRowBuilder<StringSelectMenuBuilder>()
			.addComponents(playlistMenu);

		const response = await interaction.reply({
			content: 'Select playlist to save the song:',
			components: [row1],
            ephemeral: true
		});

        const collectorFilter = (i: StringSelectMenuInteraction) => i.user.id === interaction.user.id && i.customId == "playlists";

        try {
            const playlistSelection = await response.awaitMessageComponent({ filter: collectorFilter, componentType: ComponentType.StringSelect, time: 10_000 });
            const playlist_index = playlistSelection.values[0];
            const playlist = playlistsDocs[Number(playlist_index)];
            playlistSelection.update({ content: `Selected playlist: ${playlist.name}`, components: [] });
            return playlist;
        } catch (e) {
            throw CommandException.UserPresentable(`Playlist selection expired!`)
        }
}
