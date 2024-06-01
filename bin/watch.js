const chokidar = require('chokidar');
const { fork } = require('child_process');
const Logger = require('@novice1/logger');

/**
 * \x1b[48;5;{hardcoded-color}m
 * @param {string} txt 
 * @param {string|number} color 
 * @returns 
 */
function bgColorText(txt, color) {
    return `\x1b[48;5;173m\x1b[${color || 0}m${txt}\x1b[0m`
}

/**
 * \x1b[38;5;{hardcoded-color}m
 * @param {string} txt 
 * @param {string|number} color 
 * @returns 
 */
function fgColorText(txt, color) {
    return `\x1b[38;5;174m\x1b[${color || 0}m${txt}\x1b[0m`
}

const customLogger = Logger.createLogger({
    write({ args }) {
        // Logger.colors.BRIGHT = bold
        process.stdout.write(
            bgColorText(' KAUKAU ', Logger.colors.BRIGHT) +
            ' ' +
            fgColorText(Logger.formatMessage(args, true), Logger.colors.BRIGHT) +
            '\n');
    }
});
// no need for @novice1/logger to 
// format the message as we do it all in the
// "write" function
customLogger.alwaysFormat = false

/**
 * 
 * @param {string[]} globs 
 * @param {string} cmd 
 * @param {string[]} args 
 * @returns 
 */
module.exports = function watch(globs, cmd, args) {
    // copy
    globs = globs.map(v => v)
    args = args.map(v => v)
    const argsString = args.filter(str => str != '--ignore').join(' ')

    if (!args.includes('--ignore')) {
        return;
    }

    let ts;
    function debounce(fn) {
        clearTimeout(ts);
        ts = setTimeout(fn, 1000)
    }

    /**
     * @type {ChildProcess}
     */
    let cp;

    const onAllChanges = (event, path) => {
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
    }

    // One-liner for current directory
    chokidar.watch(globs, {})
        .on('all', onAllChanges);
}