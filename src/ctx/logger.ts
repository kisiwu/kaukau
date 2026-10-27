import { Logger } from '@novice1/logger';
import type { LogLevelType, LogLevelValue } from '@novice1/logger';
import Mocha from 'mocha';
import type {
  AddFileEvent,
  KaukauEmitter,
  RunnerEventPayload,
  SettingMochaEndEvent,
  SettingOptionsEndEvent,
} from '../events';
import type { LogLevel } from '../options';

const debugEvents = Logger.debugger('kaukau:events');

const {
  EVENT_SUITE_BEGIN,
  EVENT_SUITE_END,
  EVENT_TEST_BEGIN,
  EVENT_TEST_END,
  EVENT_RUN_BEGIN,
  EVENT_RUN_END,
} = Mocha.Runner.constants;

export interface KaukauLoggerOptions {
  enableLogs?: boolean;
  logLevel?: LogLevel;
  /**
   * Print the `Test n° x` / `Test n° x done` lines when a run begins/ends. Default: `true`.
   */
  printRunEvents?: boolean;
}

// this reporter outputs test results, indenting two spaces per suite
export class KaukauLogger {
  private _indents = 0;
  private _enableLogs: boolean;
  private _printRunEvents: boolean;
  private _logger: ReturnType<typeof Logger.createLogger>;

  /**
   * @param runner Kaukau emitter
   */
  constructor(runner: KaukauEmitter, options: KaukauLoggerOptions = {}) {
    this._enableLogs = options.enableLogs !== false;
    this._printRunEvents = options.printRunEvents !== false;

    this._logger = Logger.createLogger({
      write: this._writeLine.bind(this),
      levels: {
        success: {
          color: Logger.colors.FG_GREEN,
          level: Logger.levels.info,
        },
      },
    });

    this._logger.level = options.logLevel as LogLevelType | LogLevelValue;

    const stats = runner.stats;

    runner
      .on(EVENT_SUITE_BEGIN, () => {
        this.increaseIndent();
      })
      .on(EVENT_SUITE_END, () => {
        this.decreaseIndent();
      })
      .on(EVENT_TEST_BEGIN, () => {
        this.increaseIndent();
      })
      .on(EVENT_TEST_END, () => {
        this.decreaseIndent();
      })
      .on('setting', ({ count }: RunnerEventPayload) => {
        debugEvents.info('setting test n°', count);
      })
      .on('setting tester', () => {
        debugEvents.info('setting tester ...');
      })
      .on('setting options', () => {
        debugEvents.info('setting options ...');
      })
      .on('setting options end', ({ kaukauOptions, mochaOptions }: SettingOptionsEndEvent) => {
        debugEvents.debug('kaukauOptions: %O', kaukauOptions());
        debugEvents.debug('mochaOptions: %O', mochaOptions());
      })
      .on('setting mocha', () => {
        debugEvents.info('setting mocha ...');
      })
      .on('add file', ({ filename, errorMessage }: AddFileEvent) => {
        debugEvents.trace('trace', filename);
        if (errorMessage) {
          debugEvents.error(errorMessage);
          this.write('error', errorMessage);
        }
      })
      .on('setting mocha end', ({ files }: SettingMochaEndEvent) => {
        debugEvents.info(`added ${files} test file(s)`);
      })
      .on('setting end', ({ count }: RunnerEventPayload) => {
        debugEvents.info('success', `setting test n° ${count} done`);
      })
      .on(EVENT_RUN_BEGIN, ({ count }: RunnerEventPayload) => {
        if (this._printRunEvents) this.write('info', 'Test n°', count);
      })
      .on(EVENT_RUN_END, ({ count }: RunnerEventPayload) => {
        if (this._printRunEvents) this.write('info', 'Test n°', count, 'done');
      })
      .on('done', () => {
        let status: 'success' | 'warn' = 'success';
        if (stats.failures) status = 'warn';
        this[status](
          'ALL DONE -',
          `${stats.passes}/${stats.passes + stats.failures} passing`
        );
      });
  }

  enableLog(bool?: unknown): void {
    this._enableLogs = !!bool;
  }

  setPrintRunEvents(bool?: unknown): void {
    this._printRunEvents = !!bool;
  }

  isPrintingRunEvents(): boolean {
    return this._printRunEvents;
  }

  indent(): string {
    return Array(this._indents).join('  ');
  }

  increaseIndent(): void {
    this._indents++;
  }

  decreaseIndent(): void {
    this._indents--;
  }

  log(...args: unknown[]): void {
    this.write('verbose', ...args);
  }

  debug(...args: unknown[]): void {
    this.write('debug', ...args);
  }

  error(...args: unknown[]): void {
    this.write('error', ...args);
  }

  warn(...args: unknown[]): void {
    this.write('warn', ...args);
  }

  info(...args: unknown[]): void {
    this.write('info', ...args);
  }

  trace(...args: unknown[]): void {
    this.write('trace', ...args);
  }

  success(...args: unknown[]): void {
    this.write('success', ...args);
  }

  protected _writeLine({ message, prefixText, level }: { message: string; prefixText: string, level: string }): void {
    const msg = `${this.indent()}kaukau ${prefixText} : ${message}\n`;
    if (level === 'error') {
      process.stderr.write(msg);
    } else {
      process.stdout.write(msg);
    }
  }

  write(level: string, ...args: unknown[]): void {
    if (this._enableLogs) {
      this._logger.custom(level, ...args);
    }
  }
}
