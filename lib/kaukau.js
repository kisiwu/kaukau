const Mocha = require('mocha'),
  createStatsCollector = require('mocha/lib/stats-collector'),
  waterfall = require('async-waterfall'),
  fs = require('fs'),
  path = require('path'),
  events = require('events'),
  KaukauLogger = require('./ctx/logger'),
  Tester = require('./ctx/tester'),
  Parameters = require('./parameters'),
  { parseKaukauOptions, parseMochaOptions, parseOptions } = require('./parse-options');

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
function listFilesRecSync(dir, filelist, subdir) {
  
  subdir = subdir || '';
  filelist = filelist || [];
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
    })
  }
  return filelist;
}

exports = module.exports = Kaukau;


function Kaukau(options) {
  options =
    options && typeof options === 'object' && !Array.isArray(options)
      ? options
      : {};

  this._parsedOptions = parseOptions(options);

  // for Kaukau._parameters
  let parameters = options.parameters;

  this._parameters = new Parameters(parameters);

  this.getFiles = function getFiles() {
    return this._parsedOptions.kaukau.files;
  };

  this.getMochaOptions = function getMochaOptions() {
    return this._parsedOptions.mocha;
  };

  this.exitOnFail = function () {
    return this._parsedOptions.kaukau.exitOnFail;
  };

  this.enableLogs = function () {
    return this._parsedOptions.kaukau.enableLogs;
  };

  this.logLevel = function () {
    return this._parsedOptions.kaukau.logLevel;
  };

  this.loggerOptions = function () {
    return {
      enableLogs: this.enableLogs(),
      logLevel: this.logLevel()
    };
  };
}

/**
 * Run tests and invoke `fn()` when complete.
 *
 * @param {Function} fn
 */
Kaukau.prototype.run = function run(fn) {
  // attach events to object
  let emitter = new events.EventEmitter();
  createStatsCollector(emitter);

  let self = this;

  let c = this._parameters;

  let log = new KaukauLogger(emitter, self.loggerOptions());

  let totalFailures = 0;

  //function to run Mocha testing
  function runMocha(callback) {
    // set next parameters for the next test
    let count = c.next();

    emitter.emit('setting', {count, logger: log});

    let params = c.get.bind(c);
    
    let tester = new Tester();

    emitter.emit('setting tester', {
      logger: log,
      count,
      params,
      tester
    });

    emitter.emit('setting options', {
      logger: log,
      count,
      params
    });

    let kaukauOptions = parseKaukauOptions(
      c.get('kaukauOptions'),
      self._parsedOptions.kaukau
    );
    let mochaOptions = parseMochaOptions(
      c.get('mochaOptions'),
      self._parsedOptions.mocha
    );

    let kaukauOptionsParams = new Parameters(kaukauOptions);
    kaukauOptionsParams.next();
    let mochaOptionsParams = new Parameters(mochaOptions);
    mochaOptionsParams.next();

    emitter.emit('setting options end', {
      logger: log,
      count,
      kaukauOptions: kaukauOptionsParams.get.bind(kaukauOptionsParams),
      mochaOptions: mochaOptionsParams.get.bind(mochaOptionsParams),
      params
    });

    emitter.emit('setting mocha', {
      logger: log,
      count,
      params
    });

    // Instantiate a Mocha instance.
    let mocha = new Mocha(mochaOptions);

    let files = 0;

    /**
     * @param {String} filename file to add into Mocha instance
     */
    function addFile(filename, errorMessage) {

      emitter.emit('add file', { filename, errorMessage, logger: log });

      // delete cached file if it was previously required
      delete require.cache[require.resolve(filename)];

      // add file to Mocha instance
      mocha.addFile(filename);

      files+=1;
    }

    // otherwise, only import the mentioned files
    kaukauOptions.files.map(function (file) {
      // avoid unstoppable loop
      if(!file) {
        return;
      }

      let filename = path.resolve(file);

      // if the path does not exist
      if (!fs.existsSync(filename)) {
        let errorMessage = `no such file or directory - stat "${filename}"`;
        addFile(filename, errorMessage);
      }
      // else if the path is a directory
      else if (fs.statSync(filename).isDirectory()) {
        // Searching ext files in directory
        let subfiles = listFilesRecSync(filename).filter(function (file) {
          return file.endsWith(kaukauOptions.ext);
        });

        subfiles.map(function (subfile) {
          let subfilename = path.resolve(path.join(filename, subfile));

          addFile(subfilename);
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
      params
    });
    emitter.emit('setting end', {
      logger: log,
      count,
      params
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
    const timestamp = Date.now()
    mocha.loadFilesAsync({
      esmDecorator: file => `${file}?v=${timestamp}`
    }).then(
      () => {
        let mochaRunner = mocha.run((failures) => {
          let waterfallErr = self.exitOnFail() ? failures : null;
    
          totalFailures += failures || 0;
    
          callback(waterfallErr);
        });
        // listen to Mocha.Runner's events
        MOCHA_RUNNER_EVENTS.forEach((evnt) => {
          if (evnt) {
            mochaRunner.on(evnt, function () {
              let args = Array.from(arguments);
              args.unshift(evnt);
              args.push({count, logger: log});
              emitter.emit.apply(emitter, args);
            });
          }
        });
      },
      err => {throw err}
    );
  }

  // run Mocha as many time as there are parameters (if parameters is array)
  waterfall(
    c.all().map(() => {
      return runMocha;
    }),
    function (err, result) {
      process.on('exit', function () {
        emitter.emit('done');
        process.exit(totalFailures); // exit with non-zero status if there were failures
      });
    }
  );

  return emitter;
};
