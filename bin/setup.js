const logger = require('@novice1/logger'),
  debug = logger.debugger('kaukau:cmd:setup'),
  fs = require('fs'),
  path = require('path'),
  mkdir = require('mkdirp');

function setup(configPath, options) {
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
    logger.error(`Error --config ${configPath}`, e);
    process.exitCode = 1;
  }
}

/**
 *
 * @param {import('commander').Command} program
 * @returns {function} action
 */
function setupFactory(program) {
  return function setupAction() {
    let opts = program.opts();

    let options = {
      enableLogs: true,
      exitOnFail: false,
      files: [],
      options: {
        bail: false,
        fullTrace: true,
        grep: '',
        ignoreLeaks: true,
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
      require('debug').enable('kaukau:*');
    }

    // --config
    let configPath = opts.config || this.opts().config;

    debug.debug('--config %O', configPath);

    // --directory (DEPRECATED)
    if (opts.directory) {
      logger.warn('"--directory" is deprecated. Use "--file" instead.');
      options.files = [opts.directory];
    }

    // --file
    if (opts.file) {
      options.files = [opts.file];
    }

    debug.debug('--file %O', options.files[0]);

    setup(configPath, options);
  };
}

module.exports = setupFactory;
