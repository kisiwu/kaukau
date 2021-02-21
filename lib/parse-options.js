const KAUKAU_OPTIONS = {
  ENABLE_LOGS: {
    name: 'enableLogs',
    type: 'boolean',
  },
  EXIT_ON_FAIL: {
    name: 'exitOnFail',
    type: 'boolean',
  },
  FILE: {
    name: 'file',
    type: 'string',
  },
  FILES: {
    name: 'files',
    type: 'array',
  },
  EXT: {
    name: 'ext',
    type: 'string',
  },

  // DEPRECATED
  _DIRECTORY: {
    name: 'directory',
    type: 'string',
    deprecated: true,
  },
};

const DEFAULT_OPTIONS = {
  [KAUKAU_OPTIONS.ENABLE_LOGS.name]: true,
  [KAUKAU_OPTIONS.EXIT_ON_FAIL.name]: false,
  [KAUKAU_OPTIONS.FILES.name]: [],
  [KAUKAU_OPTIONS.EXT.name]: '.js',
};

function _parseKaukauOption(b, opts, defaultOpts, kOpt) {
  let k = kOpt.name;
  let type = kOpt.type;
  if (typeof opts[k] !== 'undefined') {
    b[k] = opts[k];
    if (type === 'boolean') {
      b[k] = !!b[k];
    } else if (type === 'array') {
      if (!Array.isArray(b[k])) {
        b[k] = [b[k]];
      }
    }
  } else if (typeof defaultOpts[k] !== 'undefined') {
    b[k] = defaultOpts[k];
  }
}

/**
 *
 * @param {*} opts
 * @param {*} [defaultOpts]
 */
function parseKaukauOptions(opts, defaultOpts) {
  let b = {};
  let ignore = [];
  opts = opts || {};
  defaultOpts = defaultOpts || {};

  // deprecated "directory" option
  if (
    typeof opts[KAUKAU_OPTIONS.FILE.name] === 'undefined' &&
    opts[KAUKAU_OPTIONS._DIRECTORY.name]
  ) {
    opts[KAUKAU_OPTIONS.FILE.name] = opts[KAUKAU_OPTIONS._DIRECTORY.name];
  }

  // "file" to "files" options
  if (
    !(
      opts[KAUKAU_OPTIONS.FILES.name] && opts[KAUKAU_OPTIONS.FILES.name].length
    ) &&
    opts[KAUKAU_OPTIONS.FILE.name]
  ) {
    _parseKaukauOption(
      b,
      {
        [KAUKAU_OPTIONS.FILES.name]: opts[KAUKAU_OPTIONS.FILE.name],
      },
      {},
      KAUKAU_OPTIONS.FILES
    );
    ignore.push(KAUKAU_OPTIONS.FILES.name);
  }

  // available options
  let kOptions = Object.keys(KAUKAU_OPTIONS)
    .map((k) => KAUKAU_OPTIONS[k])
    .filter((v) => !v.deprecated);

  // parse
  kOptions.forEach((kOpt) => {
    if (!ignore.includes(kOpt.name)) {
      _parseKaukauOption(b, opts, defaultOpts, kOpt);
    }
  });

  // "file" to "files" option
  if (!(b[KAUKAU_OPTIONS.FILES.name] && b[KAUKAU_OPTIONS.FILES.name].length)) {
    _parseKaukauOption(
      b,
      {
        [KAUKAU_OPTIONS.FILES.name]: b[KAUKAU_OPTIONS.FILE.name] || [],
      },
      {},
      KAUKAU_OPTIONS.FILES
    );
  }

  return b;
}

/**
 *
 * @param {*} opts
 * @param {*} [defaultOpts]
 */
function parseMochaOptions(opts, defaultOpts) {
  let b = {};
  opts = opts || {};
  defaultOpts = defaultOpts || {};

  if (typeof defaultOpts === 'object') {
    Object.keys(defaultOpts).forEach(function (p) {
      b[p] = defaultOpts[p];
    });
  }

  if (typeof opts === 'object') {
    Object.keys(opts).forEach(function (p) {
      b[p] = opts[p];
    });
  }
  return b;
}

/**
 *
 * @param {*} opts
 */
function parseOptions(opts) {
  let b = {};
  opts = opts || {};

  b.kaukau = parseKaukauOptions(opts, DEFAULT_OPTIONS);
  b.mocha = parseMochaOptions(opts.options, {});

  return b;
}

module.exports = {
  parseKaukauOptions,
  parseMochaOptions,
  parseOptions,
};
