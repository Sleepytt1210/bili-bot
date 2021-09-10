import {GuildManager} from "../../app/guild";
import {SongInfo} from "../model/song-info";
import {getLogger, Logger} from "../../utils/logger";
import {MessageEmbed} from "discord.js";
import {CommandException} from "../../commands/base-command";
import {shuffle} from "../../utils/utils";
import * as stream from "../bilidl";
import * as ytdl from 'ytdl-core';
import {
    AudioPlayer, AudioPlayerStatus,
    AudioResource,
    createAudioResource,
    entersState,
    VoiceConnection,
    VoiceConnectionStatus
} from "@discordjs/voice";

export class QueueManager {
    protected readonly logger: Logger;
    private readonly guild: GuildManager;
    private readonly threshold: number;
    public readonly queue: SongInfo[];
    public volume: number;
    public currentSong?: SongInfo;
    public activeConnection: VoiceConnection;
    public audioPlayer: AudioPlayer;
    private audioResource: AudioResource;
    private readonly stream: stream.Streamer;
    private _isLoop: boolean;

    // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
    get isLoop(): boolean {
        return this._isLoop;
    }

    // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
    set isLoop(value: boolean) {
        this._isLoop = value;
    }

    public constructor(guild: GuildManager, threshold: number = 3) {
        this.logger = getLogger(`QueueManager-${guild.id}`);
        this.guild = guild;
        this.queue = [];
        this.threshold = threshold;
        this._isLoop = false;
        this.stream = new stream.Streamer();
        this.volume = 0.5;
    }

    public joinChannel(voiceConnection: VoiceConnection, audioPlayer: AudioPlayer): void {
        this.activeConnection = voiceConnection;
        this.audioPlayer = audioPlayer;
        this.activeConnection.on(VoiceConnectionStatus.Disconnected, async (): Promise<void> => {
            try {
                await Promise.race([
                    entersState(this.activeConnection, VoiceConnectionStatus.Signalling, 5_000),
                    entersState(this.activeConnection, VoiceConnectionStatus.Connecting, 5_000),
                ]);
                // Seems to be reconnecting to a new channel - ignore disconnect
            } catch (error) {
                const embed = new MessageEmbed()
                    .setTitle(`${this.guild.guild.me.displayName}`)
                    .setDescription(`has left the voice channel!`)
                await this.guild.printEmbeds(embed);
                // Seems to be disconnected - destroy
                this.activeConnection.destroy();
                this.activeConnection = null;
            }
        })
    }

    public isPlaying(): boolean {
        return this.audioPlayer.state.status === AudioPlayerStatus.Playing;
    }

    public isPaused(): boolean {
        return this.audioPlayer.state.status === AudioPlayerStatus.AutoPaused || this.audioPlayer.state.status === AudioPlayerStatus.Paused
    }

    public isListEmpty(): boolean {
        return this.queue.length === 0;
    }

    public setVol(vol: number): void {
        this.volume = vol;
        if(this.audioResource) this.audioResource.volume.setVolume(this.volume);
    }

    public pushSong(song: SongInfo): void {
        this.queue.push(song);
        if (!this.isPlaying()) {
            this.playSong(this.queue.shift());
        } else {
            this.guild.printAddToQueue(song, this.queue.length);
        }
    }

    public removeSong(index: number): SongInfo {
        const removed = this.queue[index];
        this.queue.splice(index, 1);
        return removed;
    }

    public clear(): void {
        while (this.queue.length !== 0) this.queue.pop();
    }

    public promoteSong(index: number): SongInfo {
        if (index < 0 || index >= this.queue.length) {
            throw CommandException.OutOfBound(this.queue.length);
        }

        const song = this.queue.splice(index, 1)[0];
        this.queue.unshift(song);

        return song;
    }

    public doShuffle(): void {
        shuffle(this.queue);
    }

    public pause(): boolean {
        if (this.isPlaying) {
            this.audioPlayer.pause();
            return true;
        }
        return false;
    }

    public resume(): boolean {
        if (this.isPaused()) {
            this.audioPlayer.unpause();
            return true;
        }
        return false;
    }

    public stop(): void {
        if (this.audioPlayer) {
            this.audioPlayer.stop(true);
        }
        this.clear();
        this.guild.printEvent('Player stopped and the queue is cleared!')
    }

    public next(): void {
        const self = this;
        setTimeout(function (): void {
            self.playNext();
        }, 500);
    }

    private playSong(song: SongInfo): void {
        this.audioResource = createAudioResource((song.type === "y") ?
            ytdl(song.url, {quality: "highestaudio", highWaterMark: 1 << 25}) :
            this.stream.ytbdl(song.url), {metadata: song});

        this.audioPlayer.play(this.audioResource);
        this.logger.info(`Playing: ${song.title}`);
        this.activeConnection.subscribe(this.audioPlayer)
        this.audioResource.playStream.on('finish', (): void => {
            this.playNext();
        }).on('error', (err): void => {
            this.logger.error(err);
            this.guild.printEvent(`<@${song.initiator.id}> An error occurred playing ${this.currentSong.title}! Please request again`);
            this.playNext();
        });
    }

    private playNext(): void {
        if(this._isLoop === true) {
            this.playSong(this.currentSong);
        }else {
            if (this.queue.length === 0) {
                this.currentSong = null;
                this.guild.printOutOfSongs();
            } else {
                this.playSong(this.queue.shift());
            }
        }
    }
}
