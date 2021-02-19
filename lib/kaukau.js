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

  // console.log(this._parsedOptions);

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

  let log = new KaukauLogger(emitter, self.enableLogs());

  //function to run Mocha testing
  function runMocha(callback) {
    // set next parameters for the next test
    let count = c.next();

    log.write('info', 'Test n°', count);

    log.write('info', 'Creating tester... ');
    let tester = new Tester();
    log.write('success', 'Tester created');

    log.write('info', 'Checking parameters ...');

    let kaukauOptions = parseKaukauOptions(
      c.get('kaukauOptions'),
      self._parsedOptions.kaukau
    );
    let mochaOptions = parseMochaOptions(
      c.get('mochaOptions'),
      self._parsedOptions.mocha
    );
    
    //console.log(c.get('kaukauOptions'));
    //console.log('kaukauOptions options:', kaukauOptions);
    //console.log(c.get('mochaOptions'));
    //console.log('mochaOptions options:', mochaOptions);

    log.write('success', 'Done checking parameters !');

    log.write('info', 'Creating Mocha instance ... ');

    // Instantiate a Mocha instance.
    let mocha = new Mocha(mochaOptions);

    log.write('success', 'Mocha instance created ! ');

    log.write('info', 'Adding test files ...');

    /**
     * @param {String} filename file to add into Mocha instance
     */
    function addFile(filename) {
      // delete cached file if it was previously required
      delete require.cache[require.resolve(filename)];

      log.write('silly', filename);

      // add file to Mocha instance
      mocha.addFile(filename);
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
        log.write('error', errorMessage);
        addFile(filename);
      }
      // else if the path is a directory
      else if (fs.statSync(filename).isDirectory()) {
        // Searching '.js' files in directory
        let subfiles = listFilesRecSync(filename).filter(function (file) {
          return file.substr(-3) === '.js';
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

    log.write('success', 'Test files added !');

    // add context to parent suite
    mocha.suite.ctx.kaukau = {
      log,
      parameters: c.get.bind(c),
      params: c.get.bind(c),
      tester,
    };

    let mochaRunner = mocha.run((err) => {
      err = self.exitOnFail() ? err : null;

      callback(err);
    });
    // listen to Mocha.Runner's events
    MOCHA_RUNNER_EVENTS.forEach((evnt) => {
      if (evnt === EVENT_RUN_END) {
        mochaRunner.on(evnt, function () {
          let args = Array.from(arguments);
          args.unshift(evnt);
          emitter.emit.apply(emitter, args);
          log.write('info', 'Test n°', count, 'done');
        });
      } else if (evnt) {
        mochaRunner.on(evnt, function () {
          let args = Array.from(arguments);
          args.unshift(evnt);
          emitter.emit.apply(emitter, args);
        });
      }
    });
  }

  // run Mocha as many time as there are parameters (if parameters is array)
  waterfall(
    c.all().map(() => {
      return runMocha;
    }),
    function (err, result) {
      process.on('exit', function () {
        emitter.emit('done');
        process.exit(err); // exit with non-zero status if there were failures
      });
    }
  );

  return emitter;
};
