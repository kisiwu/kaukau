import type { MochaOptions } from 'mocha';
import type { IParameters, KaukauOptions } from './options';
import { Parameters } from './parameters';
import { parseKaukauOptions, parseMochaOptions, parseOptions } from './parse-options';

export interface KaukauConfig extends KaukauOptions {
    enableLogs: boolean;
    ext: string[];
    exitOnFail: boolean;
    files: string[];
    options: MochaOptions;
    parameters: (IParameters | unknown)[];
}

function parseParameters(p: IParameters): IParameters {
    if (p.kaukauOptions)
        p.kaukauOptions = parseKaukauOptions(p.kaukauOptions);
    if (p.mochaOptions)
        p.mochaOptions = parseMochaOptions(p.mochaOptions);
    return p;
}

export function defineConfig(): KaukauConfig;
export function defineConfig(config: KaukauOptions): KaukauConfig;
export function defineConfig(config?: KaukauOptions): KaukauConfig {
    const options = parseOptions(config);
    const result = options.kaukau as KaukauConfig;
    result.options = options.mocha;
    result.parameters = new Parameters(config && config.parameters ? config.parameters : undefined)
        .all()
        .map((p) => parseParameters(p as IParameters));
    return result;
}

export function defineParameters(): IParameters[];
export function defineParameters(parameters: IParameters): IParameters[];
export function defineParameters(parameters: IParameters[]): IParameters[];
export function defineParameters(parameters?: IParameters | IParameters[]): IParameters[] {
    return (new Parameters(parameters).all() as IParameters[])
        .filter((p) => p && typeof p === 'object')
        .map(parseParameters);
}
