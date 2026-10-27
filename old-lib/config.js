const Parameters = require('./parameters');
const { parseOptions, parseKaukauOptions, parseMochaOptions } = require('./parse-options');

function defineConfig(config) {
    const options = parseOptions(config);
    const result = options.kaukau;
    result.options = options.mocha;
    result.parameters = new Parameters(config && config.parameters ? config.parameters : undefined).all().map(
        p => {
            if (p.kaukauOptions)
                p.kaukauOptions = parseKaukauOptions(p.kaukauOptions);
            if (p.mochaOptions)
                p.mochaOptions = parseMochaOptions(p.mochaOptions);
            return p;
        }
    );
    return result;
}

function defineParameters(parameters) {
    const result = new Parameters(parameters).all()
        .filter(p => p && typeof p === 'object')
        .map(
            p => {
                if (p.kaukauOptions)
                    p.kaukauOptions = parseKaukauOptions(p.kaukauOptions);
                if (p.mochaOptions)
                    p.mochaOptions = parseMochaOptions(p.mochaOptions);
                return p;
            }
        );
    return result;
}

module.exports = {
    defineConfig,
    defineParameters
}