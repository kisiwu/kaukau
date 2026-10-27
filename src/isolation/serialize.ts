const MAX_DEPTH = 8;
const MARKER = '__kaukau';

export interface SerializedError {
  [MARKER]: 'error';
  name: string;
  message: string;
  stack?: string;
  /** Other own enumerable properties (`code`, `actual`, `expected`, `showDiff`, ...). */
  props: Record<string, unknown>;
}

export interface SerializedSuite {
  [MARKER]: 'suite';
  title: string;
  titlePath: string[];
  fullTitle: string;
  root: boolean;
  pending: boolean;
  file?: string;
  parent?: SerializedSuite;
}

export interface SerializedRunnable {
  [MARKER]: 'runnable';
  title: string;
  titlePath: string[];
  fullTitle: string;
  type?: string;
  state?: string;
  pending: boolean;
  duration?: number;
  speed?: string;
  file?: string;
  timedOut?: boolean;
  parent?: SerializedSuite;
  err?: SerializedError;
}

/**
 * Read-only copy of a Mocha suite received from the child process.
 */
export interface RemoteSuite {
  title: string;
  root: boolean;
  pending: boolean;
  file?: string;
  parent?: RemoteSuite;
  fullTitle(): string;
  titlePath(): string[];
  isPending(): boolean;
}

/**
 * Read-only copy of a Mocha test/hook received from the child process.
 */
export interface RemoteRunnable {
  title: string;
  type?: string;
  state?: string;
  pending: boolean;
  duration?: number;
  speed?: string;
  file?: string;
  timedOut?: boolean;
  parent?: RemoteSuite;
  err?: Error;
  fullTitle(): string;
  titlePath(): string[];
  isPending(): boolean;
  isFailed(): boolean;
  isPassed(): boolean;
}

type AnyObject = Record<string, any>;

function isObject(value: unknown): value is AnyObject {
  return typeof value === 'object' && value !== null;
}

function isPlainObject(value: AnyObject): boolean {
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

function isSuite(value: AnyObject): boolean {
  return typeof value.fullTitle === 'function' && Array.isArray(value.suites);
}

function isRunnable(value: AnyObject): boolean {
  return typeof value.fullTitle === 'function' && typeof value.titlePath === 'function';
}

function serializeSuite(suite: AnyObject): SerializedSuite {
  return {
    [MARKER]: 'suite',
    title: suite.title,
    titlePath: suite.titlePath(),
    fullTitle: suite.fullTitle(),
    root: !!suite.root,
    pending: !!suite.pending,
    file: suite.file,
    parent: isObject(suite.parent) ? serializeSuite(suite.parent) : undefined,
  };
}

export function serializeError(error: AnyObject, depth = 0, seen = new WeakSet<object>()): SerializedError {
  const props: Record<string, unknown> = {};
  for (const key of Object.keys(error)) {
    if (key !== 'name' && key !== 'message' && key !== 'stack') {
      props[key] = serializeValue(error[key], depth + 1, seen);
    }
  }
  // not enumerable on errors
  for (const key of ['cause', 'errors']) {
    if (key in error && !(key in props)) {
      props[key] = serializeValue(error[key], depth + 1, seen);
    }
  }
  return {
    [MARKER]: 'error',
    name: typeof error.name === 'string' ? error.name : 'Error',
    message: error.message === undefined ? '' : String(error.message),
    stack: typeof error.stack === 'string' ? error.stack : undefined,
    props,
  };
}

function serializeRunnable(runnable: AnyObject, depth: number, seen: WeakSet<object>): SerializedRunnable {
  return {
    [MARKER]: 'runnable',
    title: runnable.title,
    titlePath: runnable.titlePath(),
    fullTitle: runnable.fullTitle(),
    type: runnable.type,
    state: runnable.state,
    pending: !!runnable.pending,
    duration: runnable.duration,
    speed: runnable.speed,
    file: runnable.file,
    timedOut: runnable.timedOut,
    parent: isObject(runnable.parent) ? serializeSuite(runnable.parent) : undefined,
    err: isObject(runnable.err) ? serializeError(runnable.err, depth + 1, seen) : undefined,
  };
}

/**
 * Turns a value (e.g. an argument of a Mocha runner event) into something structured-cloneable.
 * Mocha tests, hooks and suites become small read-only copies, errors keep their own properties.
 */
export function serializeValue(value: unknown, depth = 0, seen = new WeakSet<object>()): unknown {
  switch (typeof value) {
    case 'function':
      return `[Function${value.name ? `: ${value.name}` : ''}]`;
    case 'symbol':
      return value.toString();
    case 'object':
      break;
    default:
      return value;
  }
  if (value === null) {
    return value;
  }
  if (seen.has(value)) {
    return '[Circular]';
  }
  if (depth > MAX_DEPTH) {
    return '[Object]';
  }
  if (value instanceof Date || value instanceof RegExp || ArrayBuffer.isView(value) || value instanceof ArrayBuffer) {
    return value;
  }

  seen.add(value);
  try {
    if (value instanceof Error) {
      return serializeError(value, depth, seen);
    }
    if (Array.isArray(value)) {
      return value.map((el) => serializeValue(el, depth + 1, seen));
    }
    const obj = value as AnyObject;
    if (isSuite(obj)) {
      return serializeSuite(obj);
    }
    if (isRunnable(obj)) {
      return serializeRunnable(obj, depth, seen);
    }
    const result: Record<string, unknown> = {};
    for (const key of Object.keys(obj)) {
      result[key] = serializeValue(obj[key], depth + 1, seen);
    }
    return result;
  } finally {
    seen.delete(value);
  }
}

function deserializeError(value: SerializedError): Error {
  const error = new Error(value.message);
  error.name = value.name;
  if (value.stack !== undefined) {
    error.stack = value.stack;
  }
  Object.assign(error, deserializeValue(value.props));
  return error;
}

function deserializeSuite(value: SerializedSuite): RemoteSuite {
  return {
    title: value.title,
    root: value.root,
    pending: value.pending,
    file: value.file,
    parent: value.parent ? deserializeSuite(value.parent) : undefined,
    fullTitle: () => value.fullTitle,
    titlePath: () => [...value.titlePath],
    isPending: () => value.pending,
  };
}

function deserializeRunnable(value: SerializedRunnable): RemoteRunnable {
  return {
    title: value.title,
    type: value.type,
    state: value.state,
    pending: value.pending,
    duration: value.duration,
    speed: value.speed,
    file: value.file,
    timedOut: value.timedOut,
    parent: value.parent ? deserializeSuite(value.parent) : undefined,
    err: value.err ? deserializeError(value.err) : undefined,
    fullTitle: () => value.fullTitle,
    titlePath: () => [...value.titlePath],
    isPending: () => value.pending,
    isFailed: () => value.state === 'failed',
    isPassed: () => value.state === 'passed',
  };
}

/**
 * Reverse of `serializeValue`: the main process gets copies of the Mocha objects, not the live ones.
 */
export function deserializeValue(value: unknown): unknown {
  if (!isObject(value)) {
    return value;
  }
  if (Array.isArray(value)) {
    return value.map(deserializeValue);
  }
  if (!isPlainObject(value)) {
    return value;
  }
  switch (value[MARKER]) {
    case 'error':
      return deserializeError(value as SerializedError);
    case 'suite':
      return deserializeSuite(value as SerializedSuite);
    case 'runnable':
      return deserializeRunnable(value as SerializedRunnable);
    default: {
      const result: Record<string, unknown> = {};
      for (const key of Object.keys(value)) {
        result[key] = deserializeValue(value[key]);
      }
      return result;
    }
  }
}

function isCloneable(value: unknown): boolean {
  try {
    structuredClone(value);
    return true;
  } catch {
    return false;
  }
}

// path of the first property that cannot be cloned, e.g. `parameters.credentials.check`
function findUncloneablePath(value: unknown, path: string): string {
  if (isObject(value) && (Array.isArray(value) || isPlainObject(value))) {
    const entries = value as AnyObject;
    for (const key of Object.keys(entries)) {
      if (!isCloneable(entries[key])) {
        return findUncloneablePath(entries[key], Array.isArray(value) ? `${path}[${key}]` : `${path}.${key}`);
      }
    }
  }
  return path;
}

/**
 * Checks that a value sent to the child process can be cloned, with an explicit message if it cannot.
 */
export function assertCloneable(label: string, value: unknown): void {
  try {
    structuredClone(value);
  } catch (err) {
    throw new Error(
      `"isolate": "${findUncloneablePath(value, label)}" cannot be sent to the child process (${(err as Error).message}). ` +
        'Use plain data only: no functions or class instances (e.g. set `reporter` as a module name or path, not a class).'
    );
  }
}
