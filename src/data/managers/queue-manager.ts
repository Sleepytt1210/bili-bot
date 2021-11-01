import {GuildManager} from "../../app/guild";
import {SongInfo} from "../model/song-info";
import {getLogger, Logger} from "../../utils/logger";
import {CommandException} from "../../commands/base-command";
import {shuffle} from "../../utils/utils";
import * as stream from "../../utils/bilidl";
import {
    AudioPlayer,
    AudioPlayerStatus,
    AudioResource, createAudioPlayer,
    createAudioResource, demuxProbe, entersState, joinVoiceChannel,
    VoiceConnection,
    VoiceConnectionStatus
} from "@discordjs/voice";
import {GuildMember, MessageEmbed, StageChannel} from "discord.js";
import {raw as youtubedl} from "youtube-dl-exec";

export class QueueManager {
    protected readonly logger: Logger;
    private readonly guild: GuildManager;
    private readonly threshold: number;
    private queueLock: boolean;
    public queue: SongInfo[];
    public volume: number;
    public currentSong?: SongInfo;
    public activeConnection: VoiceConnection;
    public audioPlayer: AudioPlayer;
    public audioResource: AudioResource<SongInfo>;
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

    public constructor(guild: GuildManager, threshold = 3) {
        this.logger = getLogger(`QueueManager-${guild.id}`);
        this.guild = guild;
        this.queue = [];
        this.queueLock = false;
        this.threshold = threshold;
        this._isLoop = false;
        this.stream = new stream.Streamer();
        this.stream.on('error', (err: Error) => {
            this.logger.error(err.message);
            throw CommandException.UserPresentable(err.message);
        })
        this.volume = 0.1;
    }

    public joinChannel(initiator: GuildMember): void {

        const voiceId = initiator.voice.channelId;

        if (!this.activeConnection || this.activeConnection.state.status === VoiceConnectionStatus.Disconnected) {
            this.activeConnection = joinVoiceChannel({
                channelId: voiceId,
                guildId: this.guild.id,
                adapterCreator: this.guild.guild.voiceAdapterCreator,
            });
            this.activeConnection.on('error', (error): void => console.warn(error));
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
                    if(this.activeConnection) this.activeConnection.destroy();
                    this.stop();
                    this.activeConnection = null;
                }
            });
            this.audioPlayer = createAudioPlayer();
            this.logger.info(`Joined channel '${initiator.voice.channel.name}'`)
        } else if (this.guild.guild.me.voice.channelId !== voiceId) {
            this.logger.info(`Rejoin channel ${initiator.voice.channel.name}`);
            this.activeConnection.rejoin({channelId: voiceId, selfMute: false, selfDeaf: true});
        }
        if (initiator.voice.channel instanceof StageChannel) {
            this.guild.guild.me.voice.setChannel(voiceId).then((me): Promise<void> => me.voice.setSuppressed(false));
        }
        this.audioPlayer.on('error', (err): void => {
            this.logger.error(err);
            this.guild.printEvent(`<@${this.currentSong.initiator.id}> An error occurred playing ${this.currentSong.title}! Please request again`);
            this.next();
        });
        this.activeConnection.subscribe(this.audioPlayer);
    }

    public isPlaying(): boolean {
        return this.audioPlayer && this.audioPlayer.state.status === AudioPlayerStatus.Playing;
    }

    public isPaused(): boolean {
        return this.audioPlayer && this.audioPlayer.state.status === AudioPlayerStatus.AutoPaused || this.audioPlayer.state.status === AudioPlayerStatus.Paused
    }

    public isListEmpty(): boolean {
        return this.queue.length === 0;
    }

    public setVol(vol: number): void {
        this.volume = vol;
        if(this.audioResource) this.audioResource.volume.setVolumeLogarithmic(vol);
    }

    public pushSong(song: SongInfo, isPlaylist?: boolean): void {
        this.queue.push(song);
        if (!this.isPlaying() && !this.queueLock) {
            void this.playNext();
        } else {
            this.guild.printAddToQueue(song, this.queue.length, isPlaylist);
        }
    }

    public removeSong(index: number): SongInfo {
        const removed = this.queue[index];
        this.queue.splice(index, 1);
        return removed;
    }

    public clear(): void {
        this.queue = [];
    }

    public promoteSong(index: number): SongInfo {
        if(this.queue.length === 0) throw CommandException.UserPresentable('Queue is empty!')
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
        if (this.isPlaying()) {
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
        this.audioPlayer.stop(true);
        void this.playNext();
    }

    private async playSong(song: SongInfo): Promise<void> {
        this.currentSong = song;

        if(!this._isLoop){
            this.guild.printPlaying(song);
        }

        this.audioResource = await this.createAudioResource(song);
        this.queueLock = false;
        this.audioPlayer.play(this.audioResource);
        this.logger.info(`Playing: ${song.title}`);
        this.audioResource.volume.setVolumeLogarithmic(this.volume);
        this.audioResource.playStream.on('finish', (): void => {
            this.next();
        }).on('error', err => this.logger.error(err));
    }

    private async playNext(): Promise<void> {

        if (this.queueLock || this.audioPlayer.state.status !== AudioPlayerStatus.Idle) {
            return;
        }

        this.queueLock = true;

        setTimeout(async function(self: QueueManager){
            if(self._isLoop === true) {
                await self.playSong(self.currentSong);
            }else {
                if (self.queue.length === 0) {
                    self.queueLock = false;
                    self.currentSong = null;
                    self.guild.printOutOfSongs();
                } else {
                    await self.playSong(self.queue.shift());
                }
            }
        }, 50, this);
    }

    public createAudioResource(song: SongInfo): Promise<AudioResource<SongInfo>> {
        return new Promise((resolve, reject) => {
            if(song.type == "b") resolve(createAudioResource(this.stream.ytbdl(song), {metadata: song, inlineVolume: true}));
            const process = youtubedl(
                song.url,
                {
                    o: '-',
                    q: '',
                    f: 'bestaudio[ext=webm+acodec=opus+asr=48000]/bestaudio/best',
                    r: '100K',
                },
                { stdio: ['ignore', 'pipe', 'ignore'] },
            );
            if (!process.stdout) {
                reject(new Error('No stdout'));
                return;
            }
            const stream = process.stdout;
            const onError = (error: Error) => {
                this.queueLock = false;
                if (!process.killed) process.kill();
                stream.resume();
                reject(error);
            };
            process
                .once('spawn', () => {
                    demuxProbe(stream)
                        .then((probe) => resolve(createAudioResource(probe.stream, { metadata: song, inputType: probe.type, inlineVolume: true })))
                        .catch(onError);
                })
                .catch(onError);
        });
    }
}
