import fs from 'node:fs';
import path from 'node:path';
import { Logger, Debug as LoggerDebug } from '@novice1/logger';
import type { Command } from 'commander';
import * as mkdir from 'mkdirp';
import type { KaukauOptions } from '../options.js';

const debug = Logger.debugger('kaukau:cmd:setup');

function setup(configPath: string, options: KaukauOptions) {
  // create directories
  mkdir.sync(path.dirname(configPath));

  // write config file
  try {
    let fileExists = fs.existsSync(configPath);
    if (
      configPath &&
      configPath.length > 2 &&
      (!fileExists || (fileExists && !fs.statSync(configPath).size))
    ) {
      let jsonOptions = JSON.stringify(options, null, ' ');
      if (!(configPath.length >= 5 && configPath.substr(-5) === '.json')) {
        jsonOptions = 'module.exports = ' + jsonOptions;
      }
      fs.writeFileSync(configPath, jsonOptions);
    }
  } catch (e) {
    Logger.error(`Error --config ${configPath}`, e);
    process.exitCode = 1;
  }
}

/**
 * Factory function to create the setup action for the commander Command instance.
 * @param program The commander Command instance
 * @returns The action function to be used with the commander Command instance
 */
function setupFactory(program: Command): ((this: Command, ...args: any[]) => void | Promise<void>) {
  return function setupAction() {
    let opts = program.opts();

    let options: KaukauOptions = {
      enableLogs: true,
      exitOnFail: false,
      files: [],
      options: {
        bail: false,
        fullTrace: true,
        grep: '',
        reporter: 'spec',
        retries: 0,
        slow: 150,
        timeout: 10000,
        ui: 'bdd',
        color: true,
      },
      parameters: [],
    };

    // --debug
    if (opts.debug) {
      LoggerDebug.enable('kaukau:*');
    }

    // --config
    let configPath = opts.config || this.opts().config;

    debug.debug('--config %O', configPath);

    // --directory (DEPRECATED)
    if (opts.directory) {
      Logger.warn('"--directory" is deprecated. Use "--file" instead.');
      options.files = [opts.directory];
    }

    // --file
    if (opts.file) {
      options.files = [opts.file];
    }

    debug.debug('--file %O', options.files?.[0]);

    setup(configPath, options);
  };
}

export default setupFactory;
