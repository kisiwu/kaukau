var Kaukau = require('../index');

var kaukau = new Kaukau(
  {
    "directory": "test/tests",
    "first": "login.js",
    "last": "logout.js",
    "options": {
      "useColors": true,
      "timeout": 10000,
      "reporter": "mochawesome"
    },
    "parameters": [
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
      },
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
      }
    ]
  }
);
kaukau.run();
