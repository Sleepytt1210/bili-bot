import {BaseCommand} from "./base-command";
import {CommandType} from "./command-type";
import {GuildManager} from "../app/guild";
import {Message, MessageEmbed} from "discord.js";
import {EmbedOptions, helpTemplate} from "../utils/utils";
import {SongInfo} from "../data/model/song-info";

export class QueueCommand extends BaseCommand {

    public alias: string[];

    public constructor() {
        super();
        this.alias = ['q'];
    }

    public name(): CommandType {
        return CommandType.QUEUE;
    }

    public async run(message: Message, guild: GuildManager, _args?: string[]): Promise<void> {
        guild.checkMemberInChannel(message.member);
        if (guild.queueManager.isListEmpty()) {
            guild.printEvent(`Pending queue is empty`);
        } else {
            const list = guild.queueManager.queue;

            const resultFunc = function (start): (song: SongInfo, index: number) => string {
                return (song, index): string => {
                    return `${start + index + 1}. **[${song.title}](${song.url})**`;
                };
            }
            const opt: EmbedOptions = {
                embedTitle: 'Queue:',
                embedFooter: '',
                list: list,
                mapFunc: resultFunc,
                start: 0
            }

            guild.printFlipPages(list, opt, message);
        }
    }

    public helpMessage(guild: GuildManager): MessageEmbed {
        const res = helpTemplate(this);
        res.addField('Usage: ', `${guild.commandPrefix}${this.name()}`);
        return res;
    }
}
