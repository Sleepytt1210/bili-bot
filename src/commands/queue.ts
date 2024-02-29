import {BaseCommand} from "./base-command.js";
import {CommandType} from "./command-type.js";
import {GuildManager} from "../app/guild.js";
import {Message, EmbedBuilder} from "discord.js";
import {EmbedOptions, helpTemplate} from "../utils/utils.js";
import {SongInfo} from "../data/model/song-info.js";

export class QueueCommand extends BaseCommand {

    public alias: string[];

    public constructor() {
        super(['q']);
    }

    public name: CommandType = CommandType.QUEUE;

    public async run(message: Message, guild: GuildManager, _args?: string[]): Promise<void> {
        guild.checkMemberInChannel(message.member);
        const queueM = guild.queueManager;
        this.logger.info("Retrieved queue manager.")
        if (queueM.isListEmpty() && queueM.currentSong == null) {
            guild.printEvent('Nothing is playing and queue is empty!')
        } else {
            const list = queueM.queue;
            const resultFunc = function (start): (song: SongInfo, index: number) => string {
                return (song, index): string => {
                    return `${start + index + 1}. **[${song.title}](${song.url})**`;
                };
            }
            const opt: EmbedOptions = {
                embedTitle: 'Queue:',
                embedFooter: {text: ''},
                list: list,
                mapFunc: resultFunc,
                start: 0,
                fields: [{name: 'Current Song:', value: `> [${queueM.currentSong.title}](${queueM.currentSong.url})`, inline: false},
                    {name: 'Loop:', value: '> ' + `${queueM.isLoop ? 'On' : 'Off'}`, inline: true},
                    {name: 'Total Songs:', value: `> ${queueM.queue.length + 1}`, inline: true}]
            }
            this.logger.info("Printing flip page for queue.")
            guild.printFlipPages(list, opt, message);
        }
    }

    public helpMessage(guild: GuildManager): EmbedBuilder {
        const res = helpTemplate(this);
        res.addFields({name: 'Usage: ', value: `${guild.commandPrefix}${this.name}`});
        return res;
    }
}
