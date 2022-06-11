var Kaukau = require('../index');

var kaukau = new Kaukau(
  {
    "directory": "test/tests",
    //"files": [
    //  "test/tests/sub2"
    //],
    "first": "login.js",
    "last": "logout.js",
    "enableLogs": true,
    "logLevel": "debug",
    "exitOnFail": false,
    "ext": ".spec.js",
    "options": {
      "color": true,
      "timeout": 10000,
      //"reporter": "mochawesome"
    },
    "parameters": [/*
      {
        "host": "https://en.wikipedia.org/",
        "credentials": {
          "email": "anotherexample@sample.com",
          "password": "anotherexample123"
        },
        "mochaOptions":{
          "color": false,
          "reporterOptions": {
            "reportDir": "logs/reports",
            "reportFilename": "wikipedia",
            "enableCharts": false,
          }
        },
        "kaukauOptions": {
          "files": [
            "test/tests/sub"
          ]
        }
      },*/
      {
        "host": "https://www.google.be/",
        "credentials": {
          "email": "example@sample.com",
          "password": "example123"
        },
        "kaukauOptions": {
          "exitOnFail": true,
          "file": "test/tests/",
          "files": "test/tests/sub2"
        },
        "mochaOptions":{
          // reporter: require('path').resolve('test/reporter')
          
          //"reporterOptions": {
          //  "reportDir": "logs/reports",
          //  "reportFilename": "google",
          //  "enableCharts": false
          //}
        }
      }
    ]
  }
);

kaukau.run()
.on('done', function(){
  // done
  console.log('done')
})
.on('fail', function(test){
  console.error(test.title);
  console.error(test.err.message);
  console.error(test.file);
});
