import { BaseCommand, CommandException } from "../base-command";
import { CommandType } from "../command-type";
import {
	EmbedBuilder,
	GuildMember,
	CacheType,
	ChatInputCommandInteraction,
	CommandInteractionOptionResolver,
} from "discord.js";
import { GuildManager } from "../../app/guild";
import { bvidExtract, toHms } from "../../data/datasources/bilibili-api.js";
import ytdl from "ytdl-core";
import { SongInfo } from "../../data/model/song-info.js";
import { AudioPlayerState, AudioPlayerStatus } from "@discordjs/voice";

export class InfoCommand extends BaseCommand {
	public constructor() {
		super(["i", "np", "nowplaying"], CommandType.INFO);
	}

	public async executeHandler(
		member: GuildMember,
		guild: GuildManager,
		args: Omit<CommandInteractionOptionResolver<CacheType>, "getMessage" | "getFocused">,
		_: ChatInputCommandInteraction
	): Promise<void> {
		const url = args.getString("url");

		if (url) {
			if (ytdl.validateURL(url) || bvidExtract(url)) await this.processResult(member, guild, url);
			else throw CommandException.UserPresentable(`Invalid url ${url}`);
		} else {
			await this.processResult(member, guild);
		}
	}

	private async processResult(member: GuildMember, guild: GuildManager, url?: string): Promise<void> {
		let currentSong = url ? await SongInfo.withUrl(url, member) : guild.queueManager.currentSong;
		if (!currentSong) {
			if (!guild.queueManager.currentSong) {
				guild.printEvent("No song is playing!");
				return;
			}
			currentSong = guild.queueManager.currentSong;
		}
		this.logger.info(`Queried song: ${currentSong.title}`);
		const embed = await this.urlInfo(currentSong);
		if (!url) {
			const audioPlayer = guild.queueManager.audioPlayer;
			const playerState: AudioPlayerState = audioPlayer.state;
			const pbDur = playerState.status !== AudioPlayerStatus.Idle ? playerState.resource.playbackDuration : 0;
			const isPaused =
				playerState.status === AudioPlayerStatus.Paused || playerState.status === AudioPlayerStatus.AutoPaused;
			const emoji = isPaused ? "<a:Zawarudo:757243016615559270>" : "<a:Rainbow_Weeb:640863491229614080>";
			const progressBar = [
				emoji + "  ",
				"▬",
				"▬",
				"▬",
				"▬",
				"▬",
				"▬",
				"▬",
				"▬",
				"▬",
				"▬",
				"▬",
				"▬",
				"▬",
				"▬",
				"▬",
			];
			const streamTime = Math.floor(pbDur / 1000);
			const stHms = toHms(streamTime);
			const playTime = Math.floor((streamTime * progressBar.length - 1) / currentSong.rawDuration) + 1;
			progressBar[playTime] = "<a:WoopWoop:640863532866469888>";
			progressBar.push(" " + stHms + "/" + currentSong.hmsDuration);
			const showString = progressBar.join("");
			embed.addFields({ name: "Progress: ", value: showString });
		} else {
			embed.addFields({ name: "Duration: ", value: currentSong?.hmsDuration });
		}
		guild.printEmbeds(embed);
	}

	private async urlInfo(song: SongInfo): Promise<EmbedBuilder> {
		return new EmbedBuilder()
			.setTitle(song.title)
			.setTimestamp()
			.setThumbnail(song.thumbnail)
			.addFields([
				{ name: "Requested by: ", value: `<@${song.initiator.id}>` },
				{ name: "Author: ", value: `${song.author}` },
			])
			.setURL(song.url);
	}
}
