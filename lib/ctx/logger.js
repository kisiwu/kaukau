// logger2.js

'use strict';

const Logger = require('@novice1/logger');
const debugEvents = Logger.debugger('kaukau:events');

const Mocha = require('mocha');
const {
  EVENT_SUITE_BEGIN,
  EVENT_SUITE_END,
  EVENT_TEST_BEGIN,
  EVENT_TEST_END,
  EVENT_RUN_BEGIN,
  EVENT_RUN_END,
} = Mocha.Runner.constants;

// this reporter outputs test results, indenting two spaces per suite
class KaukauLogger {
  /**
   *
   * @param {import('events').EventEmitter} runner Kaukau emitter
   * @param {boolean} enableLogs
   */
  constructor(runner, enableLogs) {
    this._indents = 0;
    this._enableLogs = enableLogs !== false;

    this._logger = Logger.createLogger(this._writeLine.bind(this), {
      alwaysFormat: true,
      levels: {
        success: {
          color: Logger.colors.FG_GREEN,
          level: 0,
        },
      },
    });

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
      .on('setting', ({ count }) => {
        debugEvents.info('setting test n°', count)
      })
      .on('setting tester', () => {
        debugEvents.info('setting tester ...')
      })
      .on('setting options', () => {
        debugEvents.info('setting options ...')
      })
      .on('setting options end', ( {kaukauOptions, mochaOptions} ) => {
        debugEvents.debug('kaukauOptions: %O', kaukauOptions())
        debugEvents.debug('mochaOptions: %O', mochaOptions())
      })
      .on('setting mocha', () => {
        debugEvents.info('setting mocha ...')
      })
      .on('add file', ({ filename, errorMessage }) => {
        debugEvents.silly('silly', filename);
        if (errorMessage) {
          debugEvents.error(errorMessage);
          this.write('error', errorMessage);
        }
      })
      .on('setting mocha end', ({ files }) => {
        debugEvents.info(`added ${files} test file(s)`);
      })
      .on('setting end', ({ count }) => {
        debugEvents.info('success', `setting test n° ${count} done`);
      })
      .on(EVENT_RUN_BEGIN, ({ count }) => {
        this.write('info', 'Test n°', count);
      })
      .on(EVENT_RUN_END, ({ count }) => {
        this.write('info', 'Test n°', count, 'done');
      })
      .on('done', () => {
        let status = 'success';
        if (stats.failures) status = 'warn';
        this[status](
          'ALL DONE -',
          `${stats.passes}/${stats.passes + stats.failures} passing`
        );
      });
  }

  enableLog(bool) {
    this._enableLogs = !!bool;
  }

  indent() {
    return Array(this._indents).join('  ');
  }

  increaseIndent() {
    this._indents++;
  }

  decreaseIndent() {
    this._indents--;
  }

  log() {
    let args = Array.from(arguments);
    args.unshift('log');
    return this.write.apply(this, args);
  }

  debug() {
    let args = Array.from(arguments);
    args.unshift('debug');
    return this.write.apply(this, args);
  }

  error() {
    let args = Array.from(arguments);
    args.unshift('error');
    return this.write.apply(this, args);
  }

  warn() {
    let args = Array.from(arguments);
    args.unshift('warn');
    return this.write.apply(this, args);
  }

  info() {
    let args = Array.from(arguments);
    args.unshift('info');
    return this.write.apply(this, args);
  }

  silly() {
    let args = Array.from(arguments);
    args.unshift('silly');
    return this.write.apply(this, args);
  }

  success() {
    let args = Array.from(arguments);
    args.unshift('success');
    return this.write.apply(this, args);
  }

  _writeLine(line) {
    process.stdout.write(`${this.indent()}kaukau ${line}\n`);
  }

  write() {
    if (this._enableLogs) {
      let args = Array.from(arguments);
      this._logger.custom.apply(this._logger, args);
    }
  }
}

module.exports = KaukauLogger;
