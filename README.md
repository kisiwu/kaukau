# kaukau
NodeJS test tools, [Mocha](https://mochajs.org/) wrapper.

## Install

```bash
$ npm install kaukau --save-dev
```

## Usage

### CLI

Set up [config](#configuration) file:
```bash
$ kaukau setup
```
```bash
$ kaukau setup --config kaukau-config.js
```
```bash
$ kaukau setup --config kaukau-config.js --file tests/
```
Run `tests/`:
```bash
$ kaukau --file tests/
```
Run custom [config](#configuration):
```bash
$ kaukau --config kaukau-config.js
```
Run `tests/` with custom [config](#configuration):
```bash
$ kaukau start --config kaukau-config.js --file tests/
```
Other options are available. 

Display help:
```bash
$ kaukau --help
```

### Programmatically

Run:
```js
const Kaukau = require('kaukau');
const config = require('./kaukau-config');

const kaukau = new Kaukau(config);

kaukau.run()
  // kaukau events
  .on('done', function(){ /* done testing */ })
  // mocha events (https://mochajs.org/api/runner)
  .on('test', function(test) {})
  .on('test end', function(test) {})
  .on('pass', function(test) {})
  .on('fail', function(test, err) {})
  .on('end', function() {});
```

## Configuration

A JSON object with the following properties:

- `enableLogs`: (boolean) Enable/disable kaukau logs. Default: `true`.

- `logLevel`: (string) `error`, `warn`, `info`, `verbose`, `debug`, `silly`. Default: `silly`. Learn usage [here](#logger).

- `exitOnFail`: (boolean) Exit after a set of tests fails so it won't execute tests for the next sets of parameters if there are some. Default: `false`.

- `files`: (string|string[]) Files and/or directories to be loaded for execution. Default: `[]`.

- `ext`: (string) File extensions to be loaded if `files` contains path to directories. Default: `'.js'`.

- `options`: See `mocha` options [there](https://mochajs.org/api/mocha).

- `parameters`: (object|object[]) Learn more about `parameters` option [here](#parameters).

Example:
```js
{
  /* kaukau options */
  "enableLogs": true,
  "exitOnFail": false,
  "files": [], // Test files/directories to execute. (e.g.: [ "tests/test01.js" ])
  "options": {
    /* mocha options */
  },

  /* sets of parameters */
  "parameters": [
    {      
      "kaukauOptions":{
        /* Overwrite kaukau options */
      },
      "mochaOptions":{
        /* Overwrite mocha options */
      }
      /* custom parameters */
      // ...
    }
  ]  
}
```

## Helpers

The following helpers come with `kaukau`.

### Parameters

Usefull if you need to run the same tests with different parameters and options.

If you define sets of `parameters` in your [configuration](#configuration), the test scripts will be executed for each set.
You can access parameters for the current set running as:
```js
describe('test 01', function() {

  const { params } = this.ctx.kaukau;

  /**
   * In configuration:
   * parameters: [
   *  {
   *    host: "test.com",
   *    credentials: {
   *      email: "test@test.com"
   *    }
   *  }
   * ]
   */
  let host = params('host'); // "test.com"
  let email = params('credentials.email'); // "test@test.com"
});
```

Parameters can overwrite the main configuration by using the properties `kaukauOptions` and `mochaOptions`.

`kaukauOptions` can overwrite `files` and `ext`.

`mochaOptions` can overwrite all [mocha](https://mochajs.org/api/mocha) options.

### Logger

Logging utility.

```js
describe('test 02', function() {

  const { logger } = this.ctx.kaukau;

  logger.silly('silly level');
  logger.debug('debug level');
  logger.log('verbose level');
  logger.info('info level');
  logger.warn('warn level');
  logger.error('error level');
});
```


### Tester

Example:
```js
describe('test 03', function() {

  const { params, tester } = this.ctx.kaukau;

  // set default options (request.defaults)
  tester.setRequestDefaults({});
  
  // overwrite default options
  tester.updateRequestDefaults({});
  
  /* request */
  
  it('should be ok', (done) => {
    tester.request({
      method: 'GET',
      url: params('host')
    }, (err, res, body) => {
      expect(err).to.equal(null);
      expect(res.statusCode).to.equal(200);
      done();
    });
  });
  
  // or
  
  tester.save({
    method: 'GET',
    url: params('host')
  });
  
  it('should be ok', function(){
    expect(this.err).to.equal(null);
    expect(this.res.statusCode).to.equal(200);
  });
});
```

Learn more about the options for `tester.request` and `tester.save` [there](https://www.npmjs.com/package/request).

## Reference

- [mocha](https://mochajs.org/)
- [chai](https://www.chaijs.com/api/)
- [request](https://www.npmjs.com/package/request)
