import type { EventEmitter } from 'node:events';
import Mocha from 'mocha';
import statsCollector from 'mocha/lib/stats-collector';
import type { KaukauLogger } from './ctx/logger';
import type { KaukauEmitter } from './events';
import type { PreparedSet } from './prepared-set';

// @types/mocha declares `loadFilesAsync(): Promise<void>` without the `esmDecorator` option
type MochaWithEsmDecorator = Omit<Mocha, 'loadFilesAsync'> & {
  loadFilesAsync(options?: { esmDecorator?: (file: string) => string }): Promise<void>;
};

// mocha >= 11 exposes `createStatsCollector` as a named export, but @types/mocha still declares a single `export =`
export const { createStatsCollector } = statsCollector as unknown as {
  createStatsCollector: (runner: EventEmitter) => void;
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

export const MOCHA_RUNNER_EVENTS: string[] = [
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

export interface ExecuteContext {
  emitter: KaukauEmitter;
  log: KaukauLogger;
}

/**
 * Runs the set with Mocha in the current process.
 * The Mocha runner events are emitted on `emitter` with `{ count, logger }` as last argument.
 * @returns the number of failures
 */
export function executeInProcess(
  { count, params, tester, mochaOptions, files }: PreparedSet,
  { emitter, log }: ExecuteContext
): Promise<number> {
  return new Promise<number>((resolve, reject) => {
    // Instantiate a Mocha instance.
    const mocha = new Mocha(mochaOptions);

    files.forEach((filename) => {
      // delete cached file if it was previously required
      delete require.cache[require.resolve(filename)];

      // add file to Mocha instance
      mocha.addFile(filename);
    });

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
      .then(() => {
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
      }, reject);
  });
}
