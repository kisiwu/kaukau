var Kaukau = require('../index');

var kaukau = new Kaukau(
  {
    "directory": "test/tests",
    /*
    "files": [
      "test/tests/sub2"
    ],
    */
    "first": "login.js",
    "last": "logout.js",
    "enableLogs": true,
    "exitOnFail": false,
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
        "mochaOptions":{
          // reporter: require('path').resolve('test/reporter')
          /*
          "reporterOptions": {
            "reportDir": "logs/reports",
            "reportFilename": "google",
            "enableCharts": false
          }
          */
        }
      }
    ]
  }
);

kaukau.run()
.on('done', function(){
  // done
})
.on('fail', function(test){
  console.error(test.title);
  console.error(test.err.message);
  console.error(test.file);
});
