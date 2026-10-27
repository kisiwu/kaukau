import type { MochaOptions } from 'mocha';

export type LogLevel = 'error' | 'warn' | 'info' | 'verbose' | 'debug' | 'trace' | number;

export interface BaseOptions {
    /**
     * Comma (`,`) separated or array of file extensions to be loaded if files contains path to directories. Default: `['.js', '.mjs', '.cjs']`.
     */
    ext?: string | string[];

    /**
     * Files and/or directories to be loaded for execution. Default: `[]`.
     */
    files?: string | string[];
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
