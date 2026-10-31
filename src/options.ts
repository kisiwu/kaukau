import type { MochaOptions } from 'mocha';

export type LogLevel = 'error' | 'warn' | 'info' | 'verbose' | 'debug' | 'trace' | number;

export interface IsolateOptions {
    /**
     * Modules preloaded in the child process (as `--require`), e.g. `tsx`. Comma (`,`) separated or array.
     */
    require?: string | string[];
    /**
     * Extra Node.js arguments for the child process, e.g. `['--max-old-space-size=4096']`.
     */
    execArgv?: string[];
}

/**
 * Isolation settings once normalized.
 */
export interface ResolvedIsolateOptions {
    require: string[];
    execArgv: string[];
}

export interface BaseOptions {
    /**
     * Comma (`,`) separated or array of file extensions to be loaded if files contains path to directories. Default: `['.js', '.mjs', '.cjs']`.
     */
    ext?: string | string[];

    /**
     * Files and/or directories to be loaded for execution. Default: `[]`.
     */
    files?: string | string[];

    /**
     * Run each set of parameters in its own child process, so modules (CommonJS and ES modules) and global state are never shared between sets.
     * Use an object to customize the child process. Default: `false`.
     */
    isolate?: boolean | IsolateOptions;
}

export interface IParameters {
    kaukauOptions?: BaseOptions;
    mochaOptions?: MochaOptions;
    [x: string]: unknown;
}

/**
 * https://github.com/kisiwu/kaukau?tab=readme-ov-file#configuration
 */
export interface KaukauOptions extends BaseOptions {
    /**
     * Enable/disable kaukau logs. Default: `true`.
     */
    enableLogs?: boolean;
    /**
     * Exit after a set of tests fails so it won't execute tests for the next sets of parameters if there are some. Default: `false`.
     */
    exitOnFail?: boolean;
    /**
     * https://github.com/kisiwu/kaukau?tab=readme-ov-file#logger
     */
    logLevel?: LogLevel;
    /**
     * Options to pass to Mocha.
     */
    options?: MochaOptions;
    parameters?: IParameters | IParameters[] | unknown;
}
