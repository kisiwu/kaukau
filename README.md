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
const Kaukau = require('kaukau');
const config = require('./config');

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

Example:
```js
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

Learn more about `parameters` option [here](#parameters).

See `mocha` options [there](https://mochajs.org/api/mocha).

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

### Tester

Example:
```js
describe('test 02', function() {

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

Learn more about the options [there](https://www.npmjs.com/package/request).

## Reference

- [mocha](https://mochajs.org/)
- [chai](https://www.chaijs.com/api/)
- [request](https://www.npmjs.com/package/request)
