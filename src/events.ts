import type { EventEmitter } from 'node:events';
import type Mocha from 'mocha';
import type { KaukauLogger } from './ctx/logger';
import type { Tester } from './ctx/tester';
import type { Parameters } from './parameters';

/**
 * Parameters getter, e.g. `params('host')`.
 */
export type ParametersGetter = Parameters['get'];

/**
 * Emitter returned internally by `Kaukau.run()`.
 */
export type KaukauEmitter = EventEmitter & { stats: Mocha.Stats };

/**
 * Available in the tests with `this.ctx.kaukau`.
 */
export interface KaukauContext {
  logger: KaukauLogger;
  log: KaukauLogger;
  parameters: ParametersGetter;
  params: ParametersGetter;
  tester: Tester;
}

/**
 * Payload of the Mocha runner events emitted by kaukau (last argument).
 */
export interface RunnerEventPayload {
  count: number;
  logger: KaukauLogger;
}

export interface SettingEvent {
  count: number;
  logger: KaukauLogger;
}

export interface SettingTesterEvent {
  count: number;
  logger: KaukauLogger;
  params: ParametersGetter;
  tester: Tester;
}

export interface SettingOptionsEvent {
  count: number;
  logger: KaukauLogger;
  params: ParametersGetter;
}

export interface SettingOptionsEndEvent {
  count: number;
  logger: KaukauLogger;
  kaukauOptions: ParametersGetter;
  mochaOptions: ParametersGetter;
  params: ParametersGetter;
}

export interface SettingMochaEvent {
  count: number;
  logger: KaukauLogger;
  params: ParametersGetter;
}

export interface AddFileEvent {
  filename: string;
  errorMessage?: string;
  logger: KaukauLogger;
}

export interface SettingMochaEndEvent {
  count: number;
  logger: KaukauLogger;
  files: number;
  params: ParametersGetter;
}

export interface SettingEndEvent {
  count: number;
  logger: KaukauLogger;
  params: ParametersGetter;
}
