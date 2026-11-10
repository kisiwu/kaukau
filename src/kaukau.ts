import type { MochaOptions } from 'mocha';
import { EventEmitter } from 'node:events';
import fs from 'node:fs';
import path from 'node:path';
import { KaukauLogger } from './ctx/logger.js';
import type { KaukauLoggerOptions } from './ctx/logger.js';
import { Tester } from './ctx/tester.js';
import { createStatsCollector, executeInProcess } from './execute.js';
import { runInChild } from './isolation/run-in-child.js';
import type {
  KaukauContext,
  KaukauEmitter,
  SettingEvent,
  SettingMochaEndEvent,
  SettingMochaEvent,
  SettingOptionsEndEvent,
  SettingOptionsEvent,
  SettingTesterEvent,
  SettingEndEvent,
  AddFileEvent,
} from './events.js';
import type { KaukauOptions, LogLevel, ResolvedIsolateOptions } from './options.js';
import { Parameters } from './parameters.js';
import { parseKaukauOptions, parseMochaOptions, parseOptions, resolveIsolate } from './parse-options.js';
import type { ParsedKaukauOptions } from './parse-options.js';
import type { Runner } from './runner.js';
import type { PreparedSet } from './prepared-set.js';

declare global {
  namespace Mocha {
    interface Context {
      kaukau: KaukauContext;
    }
  }
}

// List files in a directory recursively, in a synchronous way
function listFilesRecSync(dir: string, filelist: string[] = [], subdir = ''): string[] {
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

export class Kaukau {
  #parsedOptions: { kaukau: ParsedKaukauOptions; mocha: MochaOptions };
  #parameters: Parameters;

  constructor(config?: KaukauOptions) {
    const options =
      config && typeof config === 'object' && !Array.isArray(config)
        ? config
        : {};

    this.#parsedOptions = parseOptions(options);

    // for Kaukau.#parameters
    this.#parameters = new Parameters(options.parameters);
  }

  getFiles(): string[] {
    return this.#parsedOptions.kaukau.files ?? [];
  }

  getMochaOptions(): MochaOptions {
    return this.#parsedOptions.mocha;
  }

  exitOnFail(): boolean {
    return this.#parsedOptions.kaukau.exitOnFail ?? false;
  }

  /**
   * Settings of the child process each set of parameters runs in, or `null` if the isolation is disabled.
   */
  isolate(): ResolvedIsolateOptions | null {
    return resolveIsolate(this.#parsedOptions.kaukau.isolate);
  }

  enableLogs(): boolean {
    return this.#parsedOptions.kaukau.enableLogs ?? true;
  }

  logLevel(): LogLevel | undefined {
    return this.#parsedOptions.kaukau.logLevel;
  }

  loggerOptions(): KaukauLoggerOptions {
    return {
      enableLogs: this.enableLogs(),
      logLevel: this.logLevel(),
    };
  }

  /**
   * Run tests.
   * - https://github.com/kisiwu/kaukau?tab=readme-ov-file#programmatically
   */
  run(): Runner {
    // attach events to object
    const emitter = new EventEmitter() as KaukauEmitter;
    createStatsCollector(emitter as unknown as Mocha.Runner);

    const c = this.#parameters;

    const log = new KaukauLogger(emitter, this.loggerOptions());

    let totalFailures = 0;

    // sets up the next set of parameters and resolves the files to load (nothing is loaded here)
    const prepareSet = (): PreparedSet => {
      // set next parameters for the next test
      const count = c.next() ?? 0;

      emitter.emit('setting', { count, logger: log } satisfies SettingEvent);

      const params = c.get;

      const tester = new Tester();

      emitter.emit('setting tester', {
        logger: log,
        count,
        params,
        tester,
      } satisfies SettingTesterEvent);

      emitter.emit('setting options', {
        logger: log,
        count,
        params,
      } satisfies SettingOptionsEvent);

      const kaukauOptions = parseKaukauOptions(
        c.get('kaukauOptions') as object | undefined,
        this.#parsedOptions.kaukau
      );
      const mochaOptions = parseMochaOptions(
        c.get('mochaOptions') as MochaOptions | undefined,
        this.#parsedOptions.mocha
      );

      const kaukauOptionsParams = new Parameters(kaukauOptions);
      kaukauOptionsParams.next();
      const mochaOptionsParams = new Parameters(mochaOptions);
      mochaOptionsParams.next();

      emitter.emit('setting options end', {
        logger: log,
        count,
        kaukauOptions: kaukauOptionsParams.get,
        mochaOptions: mochaOptionsParams.get,
        params,
      } satisfies SettingOptionsEndEvent);

      emitter.emit('setting mocha', {
        logger: log,
        count,
        params,
      } satisfies SettingMochaEvent);

      const files: string[] = [];

      const addFile = (filename: string, errorMessage?: string): void => {
        emitter.emit('add file', { filename, errorMessage, logger: log } satisfies AddFileEvent);
        files.push(filename);
      };

      // only import the mentioned files
      (kaukauOptions.files ?? []).forEach((file) => {
        // avoid unstoppable loop
        if (!file) {
          return;
        }

        const filename = path.resolve(file);

        // if the path does not exist
        if (!fs.existsSync(filename)) {
          const errorMessage = `no such file or directory - stat "${filename}"`;
          addFile(filename, errorMessage);
        }
        // else if the path is a directory
        else if (fs.statSync(filename).isDirectory()) {
          // Searching ext files in directory
          const exts = kaukauOptions.ext ?? [];
          const subfiles = listFilesRecSync(filename).filter((subfile) =>
            exts.some((ext) => subfile.endsWith(ext))
          );

          subfiles.forEach((subfile) => {
            addFile(path.resolve(path.join(filename, subfile)));
          });
        }
        // else if the path is a file
        else {
          addFile(filename);
        }
      });

      emitter.emit('setting mocha end', {
        logger: log,
        count,
        files: files.length,
        params,
      } satisfies SettingMochaEndEvent);
      emitter.emit('setting end', {
        logger: log,
        count,
        params,
      } satisfies SettingEndEvent);

      return {
        count,
        params,
        tester,
        kaukauOptions,
        mochaOptions,
        files,
        isolate: resolveIsolate(kaukauOptions.isolate),
      };
    };

    // runs the set in a child process if it is isolated, in the current process otherwise
    const executeSet = (prepared: PreparedSet): Promise<number> =>
      prepared.isolate
        ? runInChild(prepared, prepared.isolate, {
            emitter,
            logger: log,
            enableLogs: this.enableLogs(),
            logLevel: this.logLevel(),
          })
        : executeInProcess(prepared, { emitter, log });

    // run Mocha as many time as there are parameters (if parameters is array),
    // started on a later tick so listeners can be attached to the returned emitter
    setImmediate(async () => {
      for (let i = 0; i < c.size(); i++) {
        const failures = await executeSet(prepareSet());

        totalFailures += failures || 0;

        // stop at the first set of tests that has a fail
        if (this.exitOnFail() && failures) {
          break;
        }
      }
      emitter.emit('done', totalFailures);
    });

    return emitter as unknown as Runner;
  }
}

export type { Runner };
