import { fork, type ChildProcess } from 'node:child_process';
import { Logger } from '@novice1/logger';
import chokidar from 'chokidar';

/**
 * \x1b[48;5;{hardcoded-color}m
 * 
 * @param txt - The text to color.
 * @param color - The background color code.
 * @returns The colored text.
 */
function bgColorText(txt: string, color: string | number): string {
    return `\x1b[48;5;173m\x1b[${color || 0}m${txt}\x1b[0m`
}

/**
 * \x1b[38;5;{hardcoded-color}m
 * 
 * @param txt - The text to color.
 * @param color - The foreground color code.
 * @returns The colored text.
 */
function fgColorText(txt: string, color: string | number): string {
    return `\x1b[38;5;174m\x1b[${color || 0}m${txt}\x1b[0m`
}

const customLogger = Logger.createLogger({
    write({ args, level }) {
        // Logger.colors.BRIGHT is `bold` style for the text
        const msg = bgColorText(' KAUKAU ', Logger.colors.BRIGHT) +
            ' ' +
            fgColorText(Logger.formatMessage(args, true), Logger.colors.BRIGHT) +
            '\n';
        if (level === 'error') {
            Logger.writeStderr(msg);
        } else {
            Logger.writeStdout(msg);
        }
    }
});
// no need for @novice1/logger to 
// format the message as we do it all in the
// "write" function
customLogger.alwaysFormat = false

/**
 * Watches the specified file globs and runs the given command with arguments when changes are detected.
 * 
 * @param globs - The file globs to watch.
 * @param cmd - The command to run when changes are detected.
 * @param args - The arguments to pass to the command.
 * @returns void
 */
export default function watch(globs: string[], cmd: string, args: string[]): void {
    // copy
    globs = globs.map(v => v)
    args = args.map(v => v)
    const argsString = args.filter(str => str != '--ignore').join(' ')

    if (!args.includes('--ignore')) {
        return;
    }

    let ts: any;
    function debounce(fn: () => void) {
        clearTimeout(ts);
        ts = setTimeout(fn, 1000)
    }

    let cp: ChildProcess | null;

    // One-liner for current directory
    chokidar.watch(globs, {})
        .on('all', (event, path) => {
            if (cp) {
                customLogger.warn('[event]', event, path);
                cp.kill()
                cp = null
            }

            debounce(() => {
                customLogger.warn('[watch]', globs)
                customLogger.warn('[cmd]', cmd)
                customLogger.warn('[args]', argsString)
                cp = fork(cmd, args)
            })
        });
}