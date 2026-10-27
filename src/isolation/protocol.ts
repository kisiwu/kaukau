import type { MochaOptions } from 'mocha';
import type { KaukauLoggerOptions } from '../ctx/logger';
import type { SerializedError } from './serialize';

/**
 * Messages exchanged between the main process and the child process running a set of parameters.
 * The channel is opened by `child_process.fork` with `serialization: 'advanced'`, so every payload must be structured-cloneable.
 */

/**
 * Parent -> child: everything the child needs to run the set. Sent once, after `ready`.
 */
export interface RunMessage {
  type: 'run';
  /** Number of the set (starts at 1). */
  count: number;
  /** The current set of parameters (as returned by `params()`). */
  paramsSet: unknown;
  /** Snapshot of the tester. */
  tester: { requestInit: RequestInit; sessionId: string };
  mochaOptions: MochaOptions;
  /** Absolute paths of the test files. */
  files: string[];
  loggerOptions: KaukauLoggerOptions;
}

/**
 * Child -> parent: the child is listening, it can receive `run`.
 */
export interface ReadyMessage {
  type: 'ready';
}

/**
 * Child -> parent: a Mocha runner event (without the kaukau payload, the parent adds its own).
 */
export interface EventMessage {
  type: 'event';
  name: string;
  /** Serialized with `serializeValue` */
  args: unknown[];
}

/**
 * Child -> parent: the run is over. Authoritative over the exit code of the child.
 */
export interface ResultMessage {
  type: 'result';
  failures: number;
}

/**
 * Child -> parent: the set could not be run (e.g. a test file cannot be loaded).
 */
export interface ErrorMessage {
  type: 'error';
  error: SerializedError;
}

export type ParentToChildMessage = RunMessage;

export type ChildToParentMessage = ReadyMessage | EventMessage | ResultMessage | ErrorMessage;
