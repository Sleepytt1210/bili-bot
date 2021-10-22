import {BaseCommand, CommandException} from "./base-command";
import {CommandType} from "./command-type";
import {GuildManager} from "../app/guild";
import {Message, MessageEmbed} from "discord.js";
import * as api from "../data/datasources/bilibili-api";
import {BiliSongEntity} from "../data/datasources/bilibili-api";
import {EmbedOptions, helpTemplate} from "../utils/utils";
import {XmlEntities} from 'html-entities';

const decoder = new XmlEntities();

export class SearchCommand extends BaseCommand {

    public alias: string[];

    public constructor() {
        super(['se', 'find']);
    }

    public name(): CommandType {
        return CommandType.SEARCH;
    }

    public async run(message: Message, guild: GuildManager, args?: string[]): Promise<void> {
        guild.checkMemberInChannel(message.member);

        const userid = message.author.id;

        const timer = guild.currentSearchTimer.get(userid);
        if(timer) clearTimeout(timer)

        if (args.length === 0) {
            guild.printEmbeds(this.helpMessage(guild));
            return;
        }

        const keyword = args.join(" ");

        const entities = await api.search(keyword, 50);
        guild.setCurrentSearchResult(null, message.author.id);
        if (entities.length === 0) {
            throw CommandException.UserPresentable("No result found");
        } else {
            guild.setCurrentSearchResult(entities, message.author.id);

            const resultFunc = function (start): (entity: BiliSongEntity, index: number) => string {
                return (entity, index): string => {
                    return decoder.decode(`\`\`\`${start + index + 1}. ${entity.title} - ${entity.play} plays\`\`\``);
                };
            }
            const opt: EmbedOptions = {
                embedTitle: `Search Result for ${keyword}: `,
                start: 0,
                mapFunc: resultFunc,
                embedFooter: `Use ${guild.commandPrefix}select [number] to play a song`,
                list: entities,
                delim: '',
            }
            guild.printFlipPages(entities, opt, message);

            guild.setCurrentSearchTimer(setTimeout(function (): void {
                guild.currentSearchResult.delete(userid);
            }, 300000), userid);
        }
    }

    public helpMessage(guild: GuildManager): MessageEmbed {
        const res = helpTemplate(this);
        res.addField('Usage: ', `${guild.commandPrefix}${this.name()} <keyword>`);
        return res;
    }
}
