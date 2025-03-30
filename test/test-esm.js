var Kaukau = require('../index');

var kaukau = new Kaukau(
  {
    "files": "test/tests",
    "enableLogs": true,
    "logLevel": "debug",
    "exitOnFail": false,
    "ext": ".test.mjs",
    "options": {
      "color": true,
      "timeout": 10000
    },
    "parameters": [
      {
        "id": 222,
        "kaukauOptions": {
          //"files": "test/tests/esm/kaukau.test.mjs"
        },
      }
    ]
  }
);

kaukau.run()
  .on('done', function () {
    // done
    console.log('done')
  })
  .on('fail', function (test) {
    console.error(test.title);
    console.error(test.err.message);
    console.error(test.file);
  });
