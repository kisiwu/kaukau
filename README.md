# kaukau
JS test tools, [Mocha](https://mochajs.org/) wrapper.

## Install

```bash
$ npm install kaukau --save-dev
```

## Usage

Run `tests/`:
```bash
$ kaukau
```

Display help:
```bash
$ kaukau --help
```

Programmatically:
```js
var Kaukau = require('kaukau');
var config = require('./config');

var kaukau = new Kaukau(config);

kaukau.run()
  // kaukau events
  .on('done', function(){ /* succeeds */ })
  // mocha events
  .on('test', function(test) {})
  .on('test end', function(test) {})
  .on('pass', function(test) {})
  .on('fail', function(test, err) {})
  .on('end', function() {});
```

## Configuration

Example:
```json
{
  /* kaukau options */
  "enableLogs": true,
  "exitOnFail": false,
  "directory": "tests", // path/to/test/scripts
  "files": [], // Overwrites "directory". Used to limit/order files to be loaded for execution. (e.g.: [ "tests/test01.js" ])
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

Learn more about `parameters` option [here](###parameters).

See `mocha` options [here](https://mochajs.org/api/mocha).

## Helpers

The following helpers are the reason why `kaukau` exists.

### Parameters

Usefull if you need to run the same tests with different parameters and options.

If you define sets of `parameters` in your [configuration](##configuration), the test scripts will be executed for each set.
You can access parameters for the current set running as:
```js
var kaukau = require('kaukau');
var Parameters = kaukau.Parameters;

describe('test 01', function() {
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
  var host = Parameters('host'); // "test.com"
  var email = Parameters('credentials.email'); // "test@test.com"
});
```

### Tester

## Reference

- [mocha](https://mochajs.org/)
- [chai](https://www.chaijs.com/api/)
