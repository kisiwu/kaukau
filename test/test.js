var Kaukau = require('../index');
var Logger = Kaukau.Logger;

var kaukau = new Kaukau(
  {
    "directory": "test/tests",
    "first": "login.js",
    "last": "logout.js",
    "enableLogs": false,
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
            "enableCharts": false
          }
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
  Logger.info("ALL DONE");
})
.on('end', function(){
  //Logger.debug("end one set of test");
});
