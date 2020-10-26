import {BaseCommand, Command} from "./base-command";
import {CommandType} from "./command-type";
import {InfoCommand} from "./info";
import {PlayCommand} from "./play";
import {PauseCommand} from "./pause";
import {ResumeCommand} from "./resume";
import {NextCommand} from "./next";
import {StopCommand} from "./stop";
import {ClearCommand} from "./clear";
import {ShuffleCommand} from "./shuffle";
import {LeaveCommand} from "./leave";
import {LoadCommand} from "./load";
import {QueueCommand} from "./queue";
import {PromoteCommand} from "./promote";
import {SearchCommand} from "./search";
import {SelectCommand} from "./select";
import {ShowlistCommand} from "./showlist";
import {HelpCommand} from "./help";
import {SummonCommand} from "./summon";
import {LoopCommand} from "./loop";
import {PlaylistsCommand} from "./playlists";
import {SetPrefixCommand} from "./prefix";
import {SaveCommand} from "./save";
import {PullCommand} from "./pull";
import {RemoveCommand} from "./remove";
import {VolumeCommand} from "./volume";

const CommTemp = new Map<string, BaseCommand>([
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
    [CommandType.SHOWLIST, new ShowlistCommand()],
    [CommandType.SUMMON, new SummonCommand()],
    [CommandType.VOLUME, new VolumeCommand()]
]);

function comp(): Map<string, BaseCommand> {
    CommTemp.forEach((command) => {
        if(command.alias) {
            command.alias.forEach((alias) => {
                CommTemp.set(alias, command);
            })
        }
    });
    //console.log(CommTemp.keys());
    return CommTemp;
}


export const Commands = comp();


