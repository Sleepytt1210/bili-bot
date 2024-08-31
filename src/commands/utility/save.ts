import { BaseCommand, CommandException } from "../base-command";
import { CommandType } from "../command-type";
import { GuildManager } from "../../app/guild";
import {
	EmbedBuilder,
	User,
	GuildMember,
	CommandInteractionOptionResolver,
	CacheType,
	ChatInputCommandInteraction,
	StringSelectMenuBuilder,
	StringSelectMenuOptionBuilder,
	ActionRowBuilder,
	InteractionResponse,
	Interaction,
	ComponentType,
} from "discord.js";
import { helpTemplate, isNum, playlistSelector, ytPlIdExtract } from "../../utils/utils";
import { SongInfo } from "../../data/model/song-info.js";
import { PlaylistDoc } from "../../data/db/schemas/playlist.js";
import { LoadCommand } from "./load.js";
import { BiliSongEntity, bvidExtract } from "../../data/datasources/bilibili-api.js";
import { Logger } from "winston";
import { getLogger } from "utils/logger";

export class SaveCommand extends BaseCommand {

	public constructor() {
		super(["add"], CommandType.SAVE);
		this.addSubcommand((subcommand) =>
			subcommand
				.setName("song")
				.setDescription("Save a song into playlist")
				.addStringOption((option) =>
					option
						.setName("url")
						.setDescription(
							"Url of the song, if left empty BiliBot will attempt to save the current playing song."
						)
				)
		).addSubcommand((subcommand) =>
			subcommand
				.setName("playlist")
				.setDescription("Save a list of songs into a playlist")
				.addStringOption((option) => 
                    option
                        .setName("url")
                        .setDescription("Url of the song")
                        .setRequired(true)
                )
		);
	}

	public name: CommandType = CommandType.SAVE;

	public async executeHandler(
		member: GuildMember,
		guild: GuildManager,
		args: Omit<CommandInteractionOptionResolver<CacheType>, "getMessage" | "getFocused">,
		interaction: ChatInputCommandInteraction
	): Promise<void> {
		const [playlist, _] = await playlistSelector(member, "save the song", interaction);
		const subcommand = args.getSubcommand(true);

		if (subcommand == "song" || subcommand == "playlist") {
			if (subcommand == "song") {
				const url = args.getString("url");
				// Save as a new playlist // If not a playlist
				let song: SongInfo | null = null;
				var errMsg = "";
				if (!url) {
					song = guild.queueManager.currentSong;
					errMsg = "No song is playing!";
				} else {
					song = await SongInfo.withUrl(url, member);
					errMsg = `Invalid url ${url}, song cannot be found!`;
				}

				if (!song) {
					throw CommandException.UserPresentable(errMsg);
				}
				await SaveCommand.save(guild, member.user, song, playlist);
			} else if (subcommand == "playlist") {
				const url = args.getString("url", true);
				const type = ytPlIdExtract(url) ? "y" : bvidExtract(url) ? "b" : null;
				if (type == "y") {
					this.logger.info("Loading from YouTube playlist");
					await LoadCommand.loadYouTubeList(member, guild, url, true, this.logger, playlist);
				} else if (type == "b") {
					this.logger.info("Loading from BiliBili playlist");
					await LoadCommand.loadBiliBiliList(member, guild, url, true, this.logger, playlist);
				} else {
					throw CommandException.UserPresentable(`Invalid url ${url}!`);
				}
			}
		} else {
			throw CommandException.UserPresentable("Please specify a subcommand, song or playlist", this.helpMessage(guild));
		}
	}

	public static async save(
		guild: GuildManager,
		user: User,
		song: SongInfo | BiliSongEntity,
		cur: PlaylistDoc
	): Promise<void> {
		if (!song) {
			throw CommandException.UserPresentable("Invalid url!");
		}
		await guild.dataManager.saveToPlaylist(song, user, cur);
		guild.printEvent(`**[${song.title}](${song.url})** saved to *${cur.name}*`);
	}

	public helpMessage(guild: GuildManager): EmbedBuilder {
		const res = helpTemplate(this);
		const pref = guild.commandPrefix + this.name;
		res.addFields({
			name: "Usage: ",
			value: `${pref} <url>
                    ${pref} current/c (Save playing song into selected playlist)
                    ${pref} -list/-l <list-url> (Append a playlist into selected playlist)`,
		});
		return res;
	}
}
