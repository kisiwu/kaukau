import type { MochaOptions } from 'mocha';
import type { LogLevel } from './options';

interface KaukauOptionDefinition {
  readonly name: string;
  readonly type: 'boolean' | 'number' | 'string' | 'array';
  readonly elemType?: string;
  readonly deprecated?: boolean;
}

const KAUKAU_OPTIONS = {
  ENABLE_LOGS: {
    name: 'enableLogs',
    type: 'boolean',
  },
  LOG_LEVEL: {
    name: 'logLevel',
    type: 'number',
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
    elemType: 'string',
  },
  EXT: {
    name: 'ext',
    type: 'array',
    elemType: 'string',
  },

  // DEPRECATED
  _DIRECTORY: {
    name: 'directory',
    type: 'string',
    deprecated: true,
  },
} as const satisfies Record<string, KaukauOptionDefinition>;

const DEFAULT_OPTIONS = {
  [KAUKAU_OPTIONS.ENABLE_LOGS.name]: true,
  [KAUKAU_OPTIONS.EXIT_ON_FAIL.name]: false,
  [KAUKAU_OPTIONS.FILES.name]: [],
  [KAUKAU_OPTIONS.EXT.name]: ['.js', '.mjs', '.cjs'],
};

export interface ParsedKaukauOptions {
  enableLogs?: boolean;
  exitOnFail?: boolean;
  logLevel?: LogLevel;
  file?: string;
  files?: string[];
  ext?: string[];
}

type RawOptions = Record<string, unknown>;

function hasLength(value: unknown): boolean {
  return !!value && !!(value as { length?: unknown }).length;
}

function parseKaukauOption(
  b: RawOptions,
  opts: RawOptions,
  defaultOpts: RawOptions,
  kOpt: KaukauOptionDefinition
): void {
  const k = kOpt.name;
  const type = kOpt.type;
  if (typeof opts[k] !== 'undefined') {
    let value: unknown = opts[k];
    if (type === 'boolean') {
      value = !!value;
    } else if (type === 'array') {
      let list: unknown[];
      if (Array.isArray(value)) {
        list = value;
      } else if (typeof value === 'string') {
        list = value.split(',');
      } else {
        list = [value];
      }
      if (kOpt.elemType) {
        const tmp = list.filter((el) => typeof el == kOpt.elemType);
        if (!tmp.length && typeof defaultOpts[k] !== 'undefined') {
          value = defaultOpts[k];
        } else {
          value = tmp;
        }
      } else {
        value = list;
      }
    }
    b[k] = value;
  } else if (typeof defaultOpts[k] !== 'undefined') {
    b[k] = defaultOpts[k];
  }
}

export function parseKaukauOptions(
  opts?: object | null,
  defaultOpts?: object | null
): ParsedKaukauOptions {
  const b: RawOptions = {};
  const ignore: string[] = [];
  const options = (opts || {}) as RawOptions;
  const defaults = (defaultOpts || {}) as RawOptions;

  // deprecated "directory" option
  if (
    typeof options[KAUKAU_OPTIONS.FILE.name] === 'undefined' &&
    options[KAUKAU_OPTIONS._DIRECTORY.name]
  ) {
    options[KAUKAU_OPTIONS.FILE.name] = options[KAUKAU_OPTIONS._DIRECTORY.name];
  }

  // "file" to "files" options
  if (
    !hasLength(options[KAUKAU_OPTIONS.FILES.name]) &&
    options[KAUKAU_OPTIONS.FILE.name]
  ) {
    parseKaukauOption(
      b,
      {
        [KAUKAU_OPTIONS.FILES.name]: options[KAUKAU_OPTIONS.FILE.name],
      },
      {},
      KAUKAU_OPTIONS.FILES
    );
    ignore.push(KAUKAU_OPTIONS.FILES.name);
  }

  // available options
  const kOptions: KaukauOptionDefinition[] = Object.values(KAUKAU_OPTIONS).filter(
    (v: KaukauOptionDefinition) => !v.deprecated
  );

  // parse
  kOptions.forEach((kOpt) => {
    if (!ignore.includes(kOpt.name)) {
      parseKaukauOption(b, options, defaults, kOpt);
    }
  });

  // "file" to "files" option
  if (!hasLength(b[KAUKAU_OPTIONS.FILES.name])) {
    parseKaukauOption(
      b,
      {
        [KAUKAU_OPTIONS.FILES.name]: b[KAUKAU_OPTIONS.FILE.name] || [],
      },
      {},
      KAUKAU_OPTIONS.FILES
    );
  }

  return b as ParsedKaukauOptions;
}

export function parseMochaOptions(
  opts?: MochaOptions | null,
  defaultOpts?: MochaOptions | null
): MochaOptions {
  const b: Record<string, unknown> = {};
  const options = opts || {};
  const defaults = defaultOpts || {};

  if (typeof defaults === 'object') {
    Object.assign(b, defaults);
  }

  if (typeof options === 'object') {
    Object.assign(b, options);
  }
  return b as MochaOptions;
}

export function parseOptions(opts?: object | null): {
  kaukau: ParsedKaukauOptions;
  mocha: MochaOptions;
} {
  const options = (opts || {}) as { options?: MochaOptions };

  return {
    kaukau: parseKaukauOptions(options, DEFAULT_OPTIONS),
    mocha: parseMochaOptions(options.options, {}),
  };
}
