import {CommandException, SubCommand} from "../base-command";
import {CommandType} from "../command-type";
import {GuildManager} from "../../app/guild";
import {Message, EmbedBuilder} from "discord.js";
import {helpTemplate, isNum} from "../../utils/utils";
import {PlaylistDataSource} from "../../data/datasources/playlist-datasource.js";

export class SetDefaultPlaylistCommand extends SubCommand {

    public readonly parent: string;

    public constructor() {
        super(['setdefault'], CommandType.PLAYLISTS);
    }

    public name: CommandType = CommandType.SETDEFAULTPLAYLIST;

    public getParent(): string {
        return this.parent;
    }

    public async executeHandler(member: GuildMember, guild: GuildManager, args: Omit<CommandInteractionOptionResolver<CacheType>, "getMessage" | "getFocused">, interaction: ChatInputCommandInteraction): Promise<void> {
        let playlist;
        // Check argument to be index or name
        if (args.length === 0) {
            throw CommandException.UserPresentable(`Please enter a name or index!`);
        } else if (args.length === 1 && isNum(args[0])) {
            const index = Number.parseInt(args.shift());
            const lists = await guild.dataManager.showPlayLists(message.author);
            if (!(index > 0 && index <= lists.length))
                throw CommandException.OutOfBound(lists.length);
            playlist = lists[index - 1];
        } else {
            const name = args.join(' ');
            playlist = await PlaylistDataSource.getInstance().get(message.author, name);
            if (!playlist) throw CommandException.UserPresentable(`Playlist ${name} does not exist!`);
        }
        await PlaylistDataSource.getInstance().setDefault(message.author, playlist.name).then((): void => {
            guild.printEvent(`Playlist ${playlist.name} is set to default!`);
        });
    }

    public helpMessage(guild: GuildManager): EmbedBuilder {
        const res = helpTemplate(this);
        res.addFields({name: 'Usage: ', value: `${guild.commandPrefix}${this.parent} ${this.name} <name>/<index>`});
        return res;
    }
}
