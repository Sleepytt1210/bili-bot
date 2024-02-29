import {BaseCommand, CommandException} from "./base-command.js";
import {CommandType} from "./command-type.js";
import {GuildManager} from "../app/guild.js";
import {Message, EmbedBuilder} from "discord.js";
import * as api from "../data/datasources/bilibili-api.js";
import {BiliSongEntity} from "../data/datasources/bilibili-api.js";
import {EmbedOptions, helpTemplate} from "../utils/utils.js";
import {decode} from 'html-entities';

export class SearchCommand extends BaseCommand {

    public alias: string[];

    public constructor() {
        super(['se', 'find']);
    }

    public name(): CommandType {
        return CommandType.SEARCH;
    }

    public async run(message: Message, guild: GuildManager, args?: string[]): Promise<void> {

        const userid = message.author.id;

        if (args.length === 0) {
            throw CommandException.UserPresentable('', this.helpMessage(guild));
        }

        const keyword = args.join(" ");

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
            guild.printFlipPages(entities, opt, message);
        } else {
            await guild.setCurrentSearchResult(null, userid);
            throw CommandException.UserPresentable("No result found");
        } 
    }

    public helpMessage(guild: GuildManager): EmbedBuilder {
        const res = helpTemplate(this);
        res.addFields({name: 'Usage: ', value: `${guild.commandPrefix}${this.name()} <keyword>`});
        return res;
    }
}
