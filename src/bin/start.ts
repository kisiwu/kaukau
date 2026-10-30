import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { Logger, Debug as LoggerDebug } from '@novice1/logger';
import type { Command } from 'commander';
import watch from './watch.js';
import { Kaukau } from '../kaukau.js';
import type { IParameters, KaukauOptions } from '../options.js';

const debug = Logger.debugger('kaukau:cmd:start');

function run(options: KaukauOptions) {
  const kaukau = new Kaukau(options);
  kaukau.run().on('done', (totalFailures) => {
    process.on('exit', function () {
      process.exit(totalFailures); // exit with non-zero status if there were failures
    });
  });
}

function listFilesRecSync(dir: string, filelist: string[] = [], subdir: string = '') {
  if (fs.existsSync(dir)) {
    fs.readdirSync(dir).forEach(function (file) {
      if (fs.statSync(path.join(dir, file)).isDirectory()) {
        filelist = listFilesRecSync(
          path.join(dir, file),
          filelist,
          path.join(subdir, file)
        );
      } else {
        filelist.push(path.join(subdir, file));
      }
    });
  }
  return filelist;
}

/**
 * Factory function to create the start action for the commander Command instance.
 * @param program The commander Command instance
 * @returns The action function to be used with the commander Command instance
 */
function startFactory(program: Command): () => Promise<void> {
  return async function startAction() {
    const opts = program.opts();

    if (!opts.ignore && opts.watch && opts.watch.length) {
      // VERY IMPORTANT to send:
      // - files to watch
      // - updated command (--ignore)
      let args = process.argv.map(arg => arg);
      const cmdIdx = args.findIndex( str => str.endsWith('kaukau') );
      if (cmdIdx > -1) {
        // start args from 'kaukau' command
        args = args.slice(cmdIdx);
        // extract command
        const cmd = args.shift() as string; // we know the first argument is the command itself
        // remove --watch <globs...>
        const watchStart = args.indexOf('--watch');
        let watchEnd = -1;
        if (watchStart > -1) {
          for(let i = watchStart+1; i < args.length; i++) {
            if (args[i].startsWith('-')) {
              break;
            }
            watchEnd = i
          }
          if (watchEnd > watchStart) {
            args = args.slice(0, watchStart).concat(args.slice(watchEnd+1))
          }
        }
        // add --ignore (just in case)
        args.push('--ignore')
        return watch(opts.watch, cmd, args)
      }
    }

    const options: KaukauOptions = {};

    // --debug
    if (opts.debug) {
      LoggerDebug.enable('kaukau:*');
    }

    // --isolate
    if (opts.isolate !== undefined) {
      options.isolate = { require: [], execArgv: [] };
    }

    // --require
    if (opts.require) {
      opts.require.forEach(function (mod: string) {
        debug.trace('--require', mod);
        if (options.isolate && typeof options.isolate === 'object' && Array.isArray(options.isolate.require)) {
          debug.trace('Requiring module in isolate mode:', mod);
          options.isolate.require.push(mod);
        }
        require(mod);
      });
    }

    // --config
    if (opts.config) {
      try {
        const fullPathConfig = path.resolve(opts.config);
        debug.debug(fullPathConfig);
        const config: Record<string, unknown> = (await import(
          (process.platform == 'win32' ? 'file://' : '') + 
          fullPathConfig,
          // Importing JSON modules is an experimental feature and might change at any time
          fullPathConfig.toLowerCase().endsWith('.json') ? 
          { with: { type: "json" } } : 
          undefined
        )).default;
        Object.keys(config).forEach((p) => ((options as Record<string, unknown>)[p] = config[p]));
      } catch (e) {
        Logger.error(
          `"--config": Could not import configuration file '${opts.config}'`,
          e
        );
        process.exitCode = 1;
        return;
      }
    }

    // --parameters
    if (opts.parameters) {
      if (!fs.existsSync(opts.parameters)) {
        Logger.error(`"--parameters": Could not find '${opts.parameters}'`);
        process.exitCode = 2;
        return;
      }

      let params = [opts.parameters];

      if (fs.statSync(opts.parameters).isDirectory()) {
        params = listFilesRecSync(opts.parameters).map((p) =>
          path.join(opts.parameters, p)
        );
      }

      options.parameters = []
      for (const p of params) {
        const fullPathParam = path.resolve(p);
        try {
          debug.debug(fullPathParam);
          (options.parameters as IParameters[]).push(
            (await import(
              (process.platform == 'win32' ? 'file://' : '') +
              fullPathParam,
              // Importing JSON modules is an experimental feature and might change at any time
              fullPathParam.toLowerCase().endsWith('.json') ?
                { with: { type: "json" } } :
                undefined
            )).default
          )
        } catch (e) {
          Logger.error(`"--parameters": Could not import '${p}'`, e);
          process.exit(2);
        }
      }
    }

    // --logs/--no-logs
    if (typeof opts.logs !== 'undefined') {
      options.enableLogs = opts.logs;
    }

    // --exit-on-fail/--no-exit-on-fail
    if (typeof opts.exitOnFail !== 'undefined') {
      options.exitOnFail = opts.exitOnFail;
    }

    // --directory (DEPRECATED)
    if (opts.directory) {
      Logger.warn('"--directory" is deprecated. Use "--file" instead.');
      options.files = [opts.directory];
    }

    // --file
    if (opts.file) {
      options.files = [opts.file];
    }

    // --ext
    if (opts.ext) {
      options.ext = opts.ext;
    }

    run(options);
  };
}

export default startFactory;
