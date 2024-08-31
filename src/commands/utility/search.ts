import {BaseCommand, CommandException} from "../base-command";
import {CommandType} from "../command-type";
import {GuildManager} from "../../app/guild";
import {CacheType, ChatInputCommandInteraction, CommandInteractionOptionResolver, EmbedBuilder, GuildMember, TextBasedChannel, TextChannel} from "discord.js";
import * as api from "../../data/datasources/bilibili-api.js";
import {BiliSongEntity} from "../../data/datasources/bilibili-api.js";
import {EmbedOptions, helpTemplate} from "../../utils/utils";
import {decode} from 'html-entities';

export class SearchCommand extends BaseCommand {


    public constructor() {
        super(['se', 'find'], CommandType.SEARCH);
    }

    public name: CommandType = CommandType.SEARCH;

    public async executeHandler(member: GuildMember, guild: GuildManager, args: Omit<CommandInteractionOptionResolver<CacheType>, "getMessage" | "getFocused">, interaction: ChatInputCommandInteraction): Promise<void> {

        const userid = member.user.id;

        const keyword = args.getString("keyword", true);

        const entities = await api.search(keyword, 50);
        if (entities?.length > 0) {
            await guild.setCurrentSearchResult(entities, userid);

            const resultFunc = function (start: number): (entity: BiliSongEntity, index: number) => string {
                return (entity, index): string => {
                    return decode(`\`\`\`${start + index + 1}. ${entity.title} - ${entity.play} plays\`\`\``, {level: 'xml'});
                };
            }

            const currentPlaylist = await guild.getCurrentPlaylist(userid);  

            const opt: EmbedOptions = {
                embedTitle: `Search Result for ${keyword}: `,
                start: 0,
                mapFunc: resultFunc,
                embedFooter: {text: `Use ${guild.commandPrefix}select [number] to play a song, ${guild.commandPrefix}save [number] to save a song into ${currentPlaylist?.name || 'selected playlist'}.`},
                list: entities,
                delim: '',
            }
            guild.printFlipPages(entities, opt, interaction.channel as TextChannel, member.user.id);
        } else {
            await guild.setCurrentSearchResult(null, userid);
            throw CommandException.UserPresentable("No result found");
        } 
    }

    public helpMessage(guild: GuildManager): EmbedBuilder {
        const res = helpTemplate(this);
        res.addFields({name: 'Usage: ', value: `${guild.commandPrefix}${this.name} <keyword>`});
        return res;
    }
}
