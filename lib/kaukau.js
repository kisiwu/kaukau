var Mocha = require('mocha'),
  createStatsCollector = require('mocha/lib/stats-collector'),
  waterfall = require('async-waterfall');
(fs = require('fs')), (path = require('path')), (events = require('events'));
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
  EVENT_TEST_RETRY
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
  EVENT_TEST_RETRY
];

const KaukauLogger = require('./logger'),
  Tester = require('./tester'),
  Configurator = require('./configurator');


var DeepPropertyAccess = require('deep-property-access');

//require('debug').enable('mocha:runner')

exports = module.exports = Kaukau;

/**
 * Expose internals.
 */
exports.Tester = {};
exports.Configurator = {};
exports.Parameters = function (str) {
  var base = exports.Configurator.parameters || {};
  if (typeof str === 'string') {
    return DeepPropertyAccess(base, str);
  }
  return base;
};

// List all files in a directory recursively in a synchronous way
function walkSync(dir, filelist, subdir) {
  subdir = subdir || '';
  files = fs.readdirSync(dir);
  filelist = filelist || [];
  files.forEach(function (file) {
    if (fs.statSync(path.join(dir, file)).isDirectory()) {
      filelist = walkSync(
        path.join(dir, file),
        filelist,
        path.join(subdir, file)
      );
    } else {
      filelist.push(path.join(subdir, file));
    }
  });
  return filelist;
}

function Kaukau(options) {
  options =
    options && typeof options === 'object' && !Array.isArray(options)
      ? options
      : {};

  // for Kaukau
  var dir = options.directory || 'tests';
  var filesOption = options.files || [];
  var first = options.first || 'index.js';
  var last = options.last || '';
  var enableLogs =
    typeof options.enableLogs === 'undefined' ? true : options.enableLogs;
  var exitOnFail = options.exitOnFail || false;

  // for Kaukau.Configurator
  var parameters = options.parameters;

  // for Mocha
  var mochaOptions = options.options || {};

  var files = [];

  // Searching for the test files
  if (!(filesOption && filesOption.length)) {
    files = walkSync(dir).filter(function (file) {
      return file.substr(-3) === '.js';
    });
    var firstIdx = files
      .map((m) => {
        return m.replace(/\\/g, '/');
      })
      .indexOf(first);
    if (firstIdx > 0) {
      files.splice(firstIdx, 1);
      files.unshift(first);
    }
    if (last) {
      var lastIdx = files
        .map((m) => {
          return m.replace(/\\/g, '/');
        })
        .indexOf(last);
      if (lastIdx > 0 && lastIdx < files.length - 1) {
        files.splice(lastIdx, 1);
        files.push(last);
      }
    }
  }

  this.getDirectory = function getDirectory() {
    return dir;
  };

  this.getFiles = function getFiles() {
    return files;
  };

  this.getFilesOption = function getFilesOption(){
    return filesOption;
  }

  this.getMochaOptions = function getMochaOptions() {
    return mochaOptions;
  };

  this.exitOnFail = function () {
    return exitOnFail;
  };

  this.enableLogs = function() {
    return enableLogs;
  }

  exports.Configurator = Configurator(parameters);
}

/**
 * Run tests and invoke `fn()` when complete.
 *
 * @param {Function} fn
 */
Kaukau.prototype.run = function run(fn) {
  // attach events to object
  var emitter = new events.EventEmitter();
  createStatsCollector(emitter);

  var self = this;

  var c = exports.Configurator;

  var log = new KaukauLogger(emitter, self.enableLogs());

  //function to run Mocha testing
  function runMocha(callback) {

    // set next parameters for the next test
    var count = c.next();

    log.write('info', 'Test n°', count);

    log.write('info', 'Creating tester... ');
    exports.Tester = new Tester();
    log.write('success', 'Tester created');

    var optionsPlus = c.parameters.mochaOptions || {};
    var kaukauOptions = c.parameters.kaukauOptions || {};
    kaukauOptions.files = kaukauOptions.files || self.getFilesOption() || [];

    if (!Array.isArray(kaukauOptions.files)) {
      kaukauOptions.files = [kaukauOptions.files];
    }

    log.write('info', 'Checking parameters ...');

    var options = JSON.parse(JSON.stringify(self.getMochaOptions()));

    if (typeof optionsPlus === 'object') {
      Object.keys(optionsPlus).forEach(function (p) {
        options[p] = optionsPlus[p];
      });
    }

    log.write('success', 'Done checking parameters !');

    log.write('info', 'Creating Mocha instance ... ');

    // Instantiate a Mocha instance.
    var mocha = new Mocha(options);

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

    // if no files were explicitly mentioned, import all the test files
    if (!kaukauOptions.files.length) {
      self.getFiles().map(function (file) {
        var filename = path.resolve(path.join(self.getDirectory(), file));

        addFile(filename);
      });
    } else {
      // otherwise, only import the mentioned files
      kaukauOptions.files.map(function (file) {
        var filename = path.resolve(file);

        // if the path does not exist
        if (!fs.existsSync(filename)) {
          var errorMessage = `no such file or directory, stat "${filename}"`;

          log.write('error', errorMessage);
          throw new Error(`EONENT: ${errorMessage}`);
        }
        // else if the path is a directory
        else if (fs.statSync(filename).isDirectory()) {
          // Searching files in directory
          var subfiles = walkSync(filename).filter(function (file) {
            return file.substr(-3) === '.js';
          });

          subfiles.map(function (subfile) {
            var subfilename = path.resolve(path.join(filename, subfile));

            addFile(subfilename);
          });
        }
        // else if the path is a file
        else {
          addFile(filename);
        }
      });
    }

    log.write('success', 'Test files added !');
    
    // add context to parent suite
    mocha.suite.ctx.kaukau = {
      Parameters: function (str) {
        var base = exports.Configurator.parameters || {};
        if (typeof str === 'string') {
          return DeepPropertyAccess(base, str);
        }
        return base;
      },
      Log: log
    };

    var mochaRunner = mocha
      .run((err) => {
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
      } else if(evnt) {
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
