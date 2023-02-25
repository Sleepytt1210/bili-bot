import {BaseCommand, Command, SubCommand} from "./base-command.js";
import {CommandType} from "./command-type.js";
import {InfoCommand} from "./info.js";
import {PlayCommand} from "./play.js";
import {PauseCommand} from "./pause.js";
import {ResumeCommand} from "./resume.js";
import {NextCommand} from "./next.js";
import {StopCommand} from "./stop.js";
import {ClearCommand} from "./clear.js";
import {ShuffleCommand} from "./shuffle.js";
import {LeaveCommand} from "./leave.js";
import {LoadCommand} from "./load.js";
import {QueueCommand} from "./queue.js";
import {PromoteCommand} from "./promote.js";
import {SearchCommand} from "./search.js";
import {SelectCommand} from "./select.js";
import {HelpCommand} from "./help.js";
import {SummonCommand} from "./summon.js";
import {LoopCommand} from "./loop.js";
import {PlaylistsCommand} from "./playlists.js";
import {SetPrefixCommand} from "./prefix.js";
import {SaveCommand} from "./save.js";
import {PullCommand} from "./pull.js";
import {RemoveCommand} from "./remove.js";
import {VolumeCommand} from "./volume.js";

const BaseCommands = new Map<string, BaseCommand>([
    [CommandType.HELP, new HelpCommand()],
    [CommandType.INFO, new InfoCommand()],
    [CommandType.PLAY, new PlayCommand()],
    [CommandType.PAUSE, new PauseCommand()],
    [CommandType.PULL, new PullCommand()],
    [CommandType.RESUME, new ResumeCommand()],
    [CommandType.NEXT, new NextCommand()],
    [CommandType.STOP, new StopCommand()],
    [CommandType.CLEAR, new ClearCommand()],
    [CommandType.SHUFFLE, new ShuffleCommand()],
    [CommandType.LEAVE, new LeaveCommand()],
    [CommandType.LOAD, new LoadCommand()],
    [CommandType.LOOP, new LoopCommand()],
    [CommandType.PLAYLISTS, new PlaylistsCommand()],
    [CommandType.PROMOTE, new PromoteCommand()],
    [CommandType.QUEUE, new QueueCommand()],
    [CommandType.REMOVE, new RemoveCommand()],
    [CommandType.SAVE, new SaveCommand()],
    [CommandType.SEARCH, new SearchCommand()],
    [CommandType.SELECT, new SelectCommand()],
    [CommandType.SETPREFIX, new SetPrefixCommand()],
    [CommandType.SUMMON, new SummonCommand()],
    [CommandType.VOLUME, new VolumeCommand()]
]);

export const Commands = BaseCommands;

export const getCommand = (command: string, commandsList: Map<string, Command> | Map<string, SubCommand>): Command | SubCommand => {
    return commandsList.get(command) || Array.from(commandsList.values())
        .find((comm): boolean => comm.alias.includes(command));
}

