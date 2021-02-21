const Kaukau = require('../index'),
  logger = require('@novice1/logger'),
  debug = logger.debugger('kaukau:cmd:start'),
  fs = require('fs'),
  path = require('path');

function run(options) {
  let kaukau = new Kaukau(options);
  kaukau.run();
}

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
    });
  }
  return filelist;
}

/**
 *
 * @param {import('commander').Command} program
 * @returns {function} action
 */
function startFactory(program) {
  return function startAction() {
    let opts = program.opts();

    let options = {};

    // --debug
    if (opts.debug) {
      require('debug').enable('kaukau:*');
    }

    // --require
    if (opts.require) {
      opts.require.forEach(function (mod) {
        debug.silly('--require', mod);
        require(mod);
      });
    }

    // --config
    if (opts.config) {
      try {
        let fullPathConfig = path.resolve(opts.config);
        debug.debug(fullPathConfig);
        let config = require(fullPathConfig);
        Object.keys(config).forEach((p) => (options[p] = config[p]));
      } catch (e) {
        logger.error(
          `"--config": Could not import configuration file '${opts.config}'`,
          e
        );
        process.exitCode = 1;
        return;
      }
    }

    // --parameters
    if (opts.parameters) {
      if (!fs.existsSync(opts.parameters)) {
        logger.error(`"--parameters": Could not find '${opts.parameters}'`);
        process.exitCode = 2;
        return;
      }

      let params = [opts.parameters];

      if (fs.statSync(opts.parameters).isDirectory()) {
        params = listFilesRecSync(opts.parameters).map((p) =>
          path.join(opts.parameters, p)
        );
      }

      options.parameters = params.map((p) => {
        let fullPathParam = path.resolve(p);
        try {
          debug.debug(fullPathParam);
          return require(fullPathParam);
        } catch (e) {
          logger.error(`"--parameters": Could not import '${p}'`, e);
          process.exit(2);
        }
      });
    }

    // --logs/--no-logs
    if (typeof opts.logs !== 'undefined') {
      options.enableLogs = opts.logs;
    }

    // --exit-on-fail/--no-exit-on-fail
    if (typeof opts.exitOnFail !== 'undefined') {
      options.exitOnFail = opts.exitOnFail;
    }

    // --directory (DEPRECATED)
    if (opts.directory) {
      logger.warn('"--directory" is deprecated. Use "--file" instead.');
      options.files = [opts.directory];
    }

    // --file
    if (opts.file) {
      options.files = [opts.file];
    }

    // --ext
    if (opts.ext) {
      options.ext = opts.ext;
    }

    run(options);
  };
}

module.exports = startFactory;
