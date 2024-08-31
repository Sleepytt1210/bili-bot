import {BaseCommand} from "../base-command";
import {CommandType} from "../command-type";
import {GuildManager} from "../../app/guild";
import {Message, EmbedBuilder, CacheType, ChatInputCommandInteraction, CommandInteractionOptionResolver, GuildMember, TextChannel} from "discord.js";
import {EmbedOptions, helpTemplate} from "../../utils/utils";
import {SongInfo} from "../../data/model/song-info.js";

export class QueueCommand extends BaseCommand {


    public constructor() {
        super(['q'], CommandType.QUEUE);
    }

    public name: CommandType = CommandType.QUEUE;

    public async executeHandler(member: GuildMember, guild: GuildManager, _: Omit<CommandInteractionOptionResolver<CacheType>, "getMessage" | "getFocused">, interaction: ChatInputCommandInteraction): Promise<void> {
        guild.checkMemberInChannel(member);
        const queueM = guild.queueManager;
        this.logger.info("Retrieved queue manager.")
        if (queueM.isListEmpty() && queueM.currentSong == null) {
            guild.printEvent('Nothing is playing and queue is empty!')
        } else {
            const list = queueM.queue;
            const resultFunc = function (start: number): (song: SongInfo, index: number) => string {
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
                fields: [{name: 'Current Song:', value: `> [${queueM.currentSong?.title}](${queueM.currentSong?.url})`, inline: false},
                    {name: 'Loop:', value: '> ' + `${queueM.isLoop ? 'On' : 'Off'}`, inline: true},
                    {name: 'Total Songs:', value: `> ${queueM.queue.length + 1}`, inline: true}]
            }
            this.logger.info("Printing flip page for queue.")
            guild.printFlipPages(list, opt, interaction.channel as TextChannel, member.user.id);
        }
    }

    public helpMessage(guild: GuildManager): EmbedBuilder {
        const res = helpTemplate(this);
        res.addFields({name: 'Usage: ', value: `${guild.commandPrefix}${this.name}`});
        return res;
    }
}
