import { MochaOptions } from "mocha";
import { KaukauOptions, IParameters } from "./kaukau";

export interface KaukauConfig extends KaukauOptions {
    enableLogs: boolean;
    ext: string[];
    exitOnFail: boolean;
    files: string[];
    options: MochaOptions;
    parameters: (IParameters | unknown)[];
}

export function defineConfig(): KaukauConfig;
export function defineConfig(config?: KaukauOptions): KaukauConfig;

export function defineParameters(): IParameters[];
export function defineParameters(parameters?: IParameters): IParameters[];
export function defineParameters(parameters?: IParameters[]): IParameters[];
