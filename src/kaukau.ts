import Mocha from 'mocha';
import type { MochaOptions } from 'mocha';
import * as statsCollector from 'mocha/lib/stats-collector';
import { EventEmitter } from 'events';
import * as fs from 'fs';
import * as path from 'path';
import { KaukauLogger } from './ctx/logger';
import type { KaukauLoggerOptions } from './ctx/logger';
import { Tester } from './ctx/tester';
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
} from './events';
import type { KaukauOptions, LogLevel } from './options';
import { Parameters } from './parameters';
import { parseKaukauOptions, parseMochaOptions, parseOptions } from './parse-options';
import type { ParsedKaukauOptions } from './parse-options';
import type { Runner } from './runner';

declare global {
  namespace Mocha {
    interface Context {
      kaukau: KaukauContext;
    }
  }
}

// @types/mocha declares `loadFilesAsync(): Promise<void>` without the `esmDecorator` option
type MochaWithEsmDecorator = Omit<Mocha, 'loadFilesAsync'> & {
  loadFilesAsync(options?: { esmDecorator?: (file: string) => string }): Promise<void>;
};

// mocha >= 11 exposes `createStatsCollector` as a named export, but @types/mocha still declares a single `export =`
const { createStatsCollector } = statsCollector as unknown as {
  createStatsCollector: (runner: Mocha.Runner) => void;
};

const {
  EVENT_RUN_BEGIN,
  EVENT_RUN_END,
  EVENT_TEST_FAIL,
  EVENT_TEST_PASS,
  EVENT_SUITE_BEGIN,
  EVENT_SUITE_END,
  EVENT_DELAY_BEGIN,
  EVENT_DELAY_END,
  EVENT_HOOK_BEGIN,
  EVENT_HOOK_END,
  EVENT_TEST_BEGIN,
  EVENT_TEST_END,
  EVENT_TEST_PENDING,
  EVENT_TEST_RETRY,
} = Mocha.Runner.constants;

const MOCHA_RUNNER_EVENTS = [
  EVENT_RUN_BEGIN,
  EVENT_RUN_END,
  EVENT_TEST_FAIL,
  EVENT_TEST_PASS,
  EVENT_SUITE_BEGIN,
  EVENT_SUITE_END,
  EVENT_DELAY_BEGIN,
  EVENT_DELAY_END,
  EVENT_HOOK_BEGIN,
  EVENT_HOOK_END,
  EVENT_TEST_BEGIN,
  EVENT_TEST_END,
  EVENT_TEST_PENDING,
  EVENT_TEST_RETRY,
];

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

    // function to run Mocha testing, resolves with the number of failures
    const runMocha = (): Promise<number> =>
      new Promise<number>((resolve) => {
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

        // Instantiate a Mocha instance.
        const mocha = new Mocha(mochaOptions);

        let files = 0;

        const addFile = (filename: string, errorMessage?: string): void => {
          emitter.emit('add file', { filename, errorMessage, logger: log } satisfies AddFileEvent);

          // delete cached file if it was previously required
          delete require.cache[require.resolve(filename)];

          // add file to Mocha instance
          mocha.addFile(filename);

          files += 1;
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
          files,
          params,
        } satisfies SettingMochaEndEvent);
        emitter.emit('setting end', {
          logger: log,
          count,
          params,
        } satisfies SettingEndEvent);

        // add context to parent suite
        mocha.suite.ctx.kaukau = {
          logger: log,
          log,
          parameters: params,
          params,
          tester,
        };

        // handles ESM modules
        const timestamp = Date.now();
        (mocha as MochaWithEsmDecorator)
          .loadFilesAsync({
            esmDecorator: (file) => `${file}?v=${timestamp}`,
          })
          .then(
            () => {
              const mochaRunner = mocha.run((failures) => {
                resolve(failures);
              });
              // listen to Mocha.Runner's events
              MOCHA_RUNNER_EVENTS.forEach((evnt) => {
                if (evnt) {
                  mochaRunner.on(evnt, (...args: unknown[]) => {
                    emitter.emit(evnt, ...args, { count, logger: log });
                  });
                }
              });
            },
            (err) => {
              throw err;
            }
          );
      });

    // run Mocha as many time as there are parameters (if parameters is array),
    // started on a later tick so listeners can be attached to the returned emitter
    setImmediate(async () => {
      for (let i = 0; i < c.size(); i++) {
        const failures = await runMocha();

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
