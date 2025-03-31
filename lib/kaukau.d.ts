import { MochaOptions, Suite, Test, Hook } from "mocha";
//import { EventEmitter } from "events";

declare class Kaukau {
    constructor(config?: KaukauOptions);
    enableLogs(): boolean;
    exitOnFail(): boolean;
    getFiles(): string[];
    getMochaOptions(): MochaOptions;
    logLevel(): LogLevel | undefined;
    loggerOptions(): { enableLogs?: boolean, logLevel?: LogLevel };
    /**
     * Run tests.
     * - https://github.com/kisiwu/kaukau?tab=readme-ov-file#programmatically
     */
    run(): Runner;
}

// #region Runner "waiting" event
export interface Runner {
    on(event: "waiting", listener: (rootSuite: Suite) => void): this;
    once(event: "waiting", listener: (rootSuite: Suite) => void): this;
    addListener(event: "waiting", listener: (rootSuite: Suite) => void): this;
    removeListener(event: "waiting", listener: (rootSuite: Suite) => void): this;
    prependListener(event: "waiting", listener: (rootSuite: Suite) => void): this;
    prependOnceListener(event: "waiting", listener: (rootSuite: Suite) => void): this;
    emit(name: "waiting", rootSuite: Suite): boolean;
}
// #endregion Runner "waiting" event
// #region Runner "start" event
export interface Runner extends NodeJS.EventEmitter {
    on(event: "start", listener: () => void): this;
    once(event: "start", listener: () => void): this;
    addListener(event: "start", listener: () => void): this;
    removeListener(event: "start", listener: () => void): this;
    prependListener(event: "start", listener: () => void): this;
    prependOnceListener(event: "start", listener: () => void): this;
    emit(name: "start"): boolean;
}
// #endregion Runner "start" event
// #region Runner "end" event
export interface Runner extends NodeJS.EventEmitter {
    on(event: "end", listener: () => void): this;
    once(event: "end", listener: () => void): this;
    addListener(event: "end", listener: () => void): this;
    removeListener(event: "end", listener: () => void): this;
    prependListener(event: "end", listener: () => void): this;
    prependOnceListener(event: "end", listener: () => void): this;
    emit(name: "end"): boolean;
}
// #endregion Runner "end" event
// #region Runner "suite" event
interface Runner extends NodeJS.EventEmitter {
    on(event: "suite", listener: (suite: Suite) => void): this;
    once(event: "suite", listener: (suite: Suite) => void): this;
    addListener(event: "suite", listener: (suite: Suite) => void): this;
    removeListener(event: "suite", listener: (suite: Suite) => void): this;
    prependListener(event: "suite", listener: (suite: Suite) => void): this;
    prependOnceListener(event: "suite", listener: (suite: Suite) => void): this;
    emit(name: "suite", suite: Suite): boolean;
}
// #endregion Runner "suite" event
// #region Runner "suite end" event
export interface Runner extends NodeJS.EventEmitter {
    on(event: "suite end", listener: (suite: Suite) => void): this;
    once(event: "suite end", listener: (suite: Suite) => void): this;
    addListener(event: "suite end", listener: (suite: Suite) => void): this;
    removeListener(event: "suite end", listener: (suite: Suite) => void): this;
    prependListener(event: "suite end", listener: (suite: Suite) => void): this;
    prependOnceListener(event: "suite end", listener: (suite: Suite) => void): this;
    emit(name: "suite end", suite: Suite): boolean;
}
// #endregion Runner "suite end" event
// #region Runner "test" event
export interface Runner extends NodeJS.EventEmitter {
    on(event: "test", listener: (test: Test) => void): this;
    once(event: "test", listener: (test: Test) => void): this;
    addListener(event: "test", listener: (test: Test) => void): this;
    removeListener(event: "test", listener: (test: Test) => void): this;
    prependListener(event: "test", listener: (test: Test) => void): this;
    prependOnceListener(event: "test", listener: (test: Test) => void): this;
    emit(name: "test", test: Test): boolean;
}
// #endregion Runner "test" event
// #region Runner "test end" event
export interface Runner extends NodeJS.EventEmitter {
    on(event: "test end", listener: (test: Test) => void): this;
    once(event: "test end", listener: (test: Test) => void): this;
    addListener(event: "test end", listener: (test: Test) => void): this;
    removeListener(event: "test end", listener: (test: Test) => void): this;
    prependListener(event: "test end", listener: (test: Test) => void): this;
    prependOnceListener(event: "test end", listener: (test: Test) => void): this;
    emit(name: "test end", test: Test): boolean;
}
// #endregion Runner "test end" event
// #region Runner "hook" event
export interface Runner extends NodeJS.EventEmitter {
    on(event: "hook", listener: (hook: Hook) => void): this;
    once(event: "hook", listener: (hook: Hook) => void): this;
    addListener(event: "hook", listener: (hook: Hook) => void): this;
    removeListener(event: "hook", listener: (hook: Hook) => void): this;
    prependListener(event: "hook", listener: (hook: Hook) => void): this;
    prependOnceListener(event: "hook", listener: (hook: Hook) => void): this;
    emit(name: "hook", hook: Hook): boolean;
}
// #endregion Runner "hook" event
// #region Runner "hook end" event
export interface Runner extends NodeJS.EventEmitter {
    on(event: "hook end", listener: (hook: Hook) => void): this;
    once(event: "hook end", listener: (hook: Hook) => void): this;
    addListener(event: "hook end", listener: (hook: Hook) => void): this;
    removeListener(event: "hook end", listener: (hook: Hook) => void): this;
    prependListener(event: "hook end", listener: (hook: Hook) => void): this;
    prependOnceListener(event: "hook end", listener: (hook: Hook) => void): this;
    emit(name: "hook end", hook: Hook): boolean;
}
// #endregion Runner "hook end" event
// #region Runner "pass" event
export interface Runner extends NodeJS.EventEmitter {
    on(event: "pass", listener: (test: Test) => void): this;
    once(event: "pass", listener: (test: Test) => void): this;
    addListener(event: "pass", listener: (test: Test) => void): this;
    removeListener(event: "pass", listener: (test: Test) => void): this;
    prependListener(event: "pass", listener: (test: Test) => void): this;
    prependOnceListener(event: "pass", listener: (test: Test) => void): this;
    emit(name: "pass", test: Test): boolean;
}
// #endregion Runner "pass" event
// #region Runner "fail" event
export interface Runner extends NodeJS.EventEmitter {
    on(event: "fail", listener: (test: Test, err: any) => void): this;
    once(event: "fail", listener: (test: Test, err: any) => void): this;
    addListener(event: "fail", listener: (test: Test, err: any) => void): this;
    removeListener(event: "fail", listener: (test: Test, err: any) => void): this;
    prependListener(event: "fail", listener: (test: Test, err: any) => void): this;
    prependOnceListener(event: "fail", listener: (test: Test, err: any) => void): this;
    emit(name: "fail", test: Test, err: any): boolean;
}
// #endregion Runner "fail" event
// #region Runner "pending" event
export interface Runner extends NodeJS.EventEmitter {
    on(event: "pending", listener: (test: Test) => void): this;
    once(event: "pending", listener: (test: Test) => void): this;
    addListener(event: "pending", listener: (test: Test) => void): this;
    removeListener(event: "pending", listener: (test: Test) => void): this;
    prependListener(event: "pending", listener: (test: Test) => void): this;
    prependOnceListener(event: "pending", listener: (test: Test) => void): this;
    emit(name: "pending", test: Test): boolean;
}
// #endregion Runner "pending" event
// #region Runner "done" event
export interface Runner extends NodeJS.EventEmitter {
    on(event: "done", listener: (totalFailures: number) => void): this;
    once(event: "done", listener: (totalFailures: number) => void): this;
    addListener(event: "done", listener: (totalFailures: number) => void): this;
    removeListener(event: "done", listener: (totalFailures: number) => void): this;
    prependListener(event: "done", listener: (totalFailures: number) => void): this;
    prependOnceListener(event: "done", listener: (totalFailures: number) => void): this;
    emit(name: "done", totalFailures: number): boolean;
}
// #endregion Runner "done" event
// #region Runner untyped events
export interface Runner extends NodeJS.EventEmitter {
    on(event: string, listener: (...args: any[]) => void): this;
    once(event: string, listener: (...args: any[]) => void): this;
    addListener(event: string, listener: (...args: any[]) => void): this;
    removeListener(event: string, listener: (...args: any[]) => void): this;
    prependListener(event: string, listener: (...args: any[]) => void): this;
    prependOnceListener(event: string, listener: (...args: any[]) => void): this;
    emit(name: string, ...args: any[]): boolean;
}
// #endregion Runner untyped events

export type LogLevel = 'error' | 'warn' | 'info' | 'verbose' | 'debug' | 'silly' | number;

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

export = Kaukau