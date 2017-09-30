var Kaukau = require('../index');
var Logger = Kaukau.Logger;

Logger.indent(5);

//Logger.off();

var kaukau = new Kaukau(
  {
    "directory": "test/tests",
    "first": "login.js",
    "last": "logout.js",
    "enableLogs": true,
    "exitOnFail": false,
    "options": {
      "useColors": true,
      "timeout": 10000,
      //"reporter": "mochawesome"
    },
    "parameters": [
      {
        "host": "https://en.wikipedia.org/",
        "credentials": {
          "email": "anotherexample@sample.com",
          "password": "anotherexample123"
        },
        "mochaOptions":{
          "useColors": false,
          "reporterOptions": {
            "reportDir": "logs/reports",
            "reportFilename": "wikipedia",
            "enableCharts": false,
          }
        },
        "kaukauOptions": {
          "files": [
            "sub"
          ]
        }
      },
      {
        "host": "https://www.google.be/",
        "credentials": {
          "email": "example@sample.com",
          "password": "example123"
        },
        "mochaOptions":{
          "reporterOptions": {
            "reportDir": "logs/reports",
            "reportFilename": "google",
            "enableCharts": false
          }
        }
      }
    ]
  }
);

kaukau.run()
.on('done', function(){
  //Logger.on();
  Logger.tab(3).info("ALL DONE");
})
.on('fail', function(test){
  //Logger.on();
  Logger.error(test.title);
  Logger.error(test.err.message);
  Logger.error(test.file);
  //Logger.off();
});
