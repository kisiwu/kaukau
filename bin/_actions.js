const fs = require('fs'),
      path = require('path'),
      logger = require('@novice1/logger');

module.exports = {
  init: function init(dirs, files, fileWriters){
    var mkdir = require('mkdirp');

    dirs = typeof dirs === 'undefined' ? {} : dirs
    files = typeof files === 'undefined' ? {} : files
    fileWriters = typeof fileWriters === 'undefined' ? {} : fileWriters

    Object.keys(dirs).forEach(
      (d) => {
        logger.info(`${d}: ${dirs[d]}`)
        mkdir.sync(dirs[d]);
      }
    )

    Object.keys(files).forEach(
      (f) => {
        if(!files[f]) return;
        mkdir.sync(path.dirname(files[f]))
        if(fileWriters[f]){
          fileWriters[f](files[f])
          logger.info(`${f}: ${files[f]}`)
        }
      }
    )
  },

  getConfigContent: function getConfigContent(directory){

    directory = typeof directory === 'undefined' ? "" : directory

    directory = directory.replace(/\\/g,'/')

    return '{\n'
    +'\t"enableLogs": false,\n'
    +'\t"exitOnFail": false,\n'
    +'\t"directory": "'+directory+'",\n'
    +'\t"options": {\n'
    +'\t\t"bail": false,\n'
    +'\t\t"fullTrace": true,\n'
    +'\t\t"grep": "",\n'
    +'\t\t"ignoreLeaks": true,\n'
    +'\t\t"reporter": "spec",\n'
    +'\t\t"retries": 0,\n'
    +'\t\t"slow": 150,\n'
    +'\t\t"timeout": 10000,\n'
    +'\t\t"ui": "bdd",\n'
    +'\t\t"color": true\n'
    +'\t}\n'
    +'}'
  },

  writeJSON: function writeJSON(filepath, content){
    try{
      if(filepath && filepath.length > 2 && !fs.existsSync(filepath)){
        var fileContent = content
        if(!(filepath.length >= 5 && filepath.substr(-5) === '.json'))
          fileContent = 'module.exports = '+content
        fs.writeFileSync(filepath, fileContent);
      }
    }catch (e){
      logger.error("Cannot write file ", e);
    }
  }
}
