import type { MochaOptions } from 'mocha';
import type { Tester } from './ctx/tester';
import type { ParametersGetter } from './events';
import type { ResolvedIsolateOptions } from './options';
import type { ParsedKaukauOptions } from './parse-options';

/**
 * Everything known about a set of parameters once it is set up, before any test file is loaded.
 */
export interface PreparedSet {
  /**
   * Number of the set (starts at 1).
   */
  count: number;
  params: ParametersGetter;
  tester: Tester;
  kaukauOptions: ParsedKaukauOptions;
  mochaOptions: MochaOptions;
  /**
   * Absolute paths of the test files to load (nothing is loaded yet).
   */
  files: string[];
  /**
   * Settings of the child process for this set, or `null` to run in the current process.
   */
  isolate: ResolvedIsolateOptions | null;
}
