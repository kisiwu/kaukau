export default {
	"enableLogs": true,
	"exitOnFail": false,
	"files": "test/tests",
	"ext": [".mjs"],
	"options": {
		"bail": false,
		"fullTrace": true,
		"grep": "",
		"ignoreLeaks": false,
		"reporter": "spec",
		"retries": 0,
		"slow": 150,
		"timeout": 2000,
		"ui": "bdd",
		"color": true
	},
	"parameters": [{
		"id": 33,
		"mochaOptions": {
			"reporterOptions": {
				"reportDir": "logs/reports",
				"reportFilename": "esm",
				"enableCharts": false
			}
		}
	}, {
		"id": 55,
		"mochaOptions": {
			"reporterOptions": {
				"reportDir": "logs/reports",
				"reportFilename": "esm",
				"enableCharts": false
			}
		}
	}]
}
