var Mocha = require('mocha'),
    waterfall = require('async-waterfall')
    fs = require('fs'),
    path = require('path'),
    events = require('events');

var Logger = require('./logger'),
    Tester = require('./tester'),
    Configurator = require('./configurator');

var DeepPropertyAccess = require('deep-property-access');

exports = module.exports = Kaukau;

/**
 * Expose internals.
 */
exports.Logger = Logger;
exports.Tester = {};
exports.Configurator = {};
exports.Parameters = function(str){
  var base = exports.Configurator.parameters || {};
  if(typeof str === 'string'){
    return DeepPropertyAccess(base, str);
  }
  return base;
}

// List all files in a directory recursively in a synchronous way
function walkSync(dir, filelist, subdir) {
  subdir = subdir || "";
  files = fs.readdirSync(dir);
  filelist = filelist || [];
  files.forEach(function(file) {
    if (fs.statSync(path.join(dir, file)).isDirectory()) {
      filelist = walkSync(path.join(dir, file), filelist, path.join(subdir, file));
    }
    else {
      filelist.push(path.join(subdir, file));
    }
  });
  return filelist;
};

/**
* @param {Object} mocha Mocha instance
* @param {String} filename file to add into Mocha instance
*/
function addFile(mocha, filename){
  // delete cached file if it was previously required
  delete require.cache[require.resolve(filename)];

  console.log(filename);

  // add file to Mocha instance
  mocha.addFile(
    filename
  );
}

function Kaukau(options){

  options = options && typeof options === 'object' && !Array.isArray(options) ? options : {};

  // for Kaukau
  var dir = options.directory || 'tests';
  var first = options.first || 'index.js';
  var last = options.last || '';
  var enableLogs = typeof options.enableLogs === 'undefined' ? true : options.enableLogs;
  var exitOnFail = options.exitOnFail || false;

  // for Kaukau.Configurator
  var parameters = options.parameters;

  // for Mocha
  var mochaOptions = options.options || {};

  // Searching for the test files
  var files = walkSync(dir).filter(function(file){
      return file.substr(-3) === '.js';
  });
  var firstIdx = files.map((m) => {return m.replace(/\\/g,'/');}).indexOf(first);
  if(firstIdx > 0){
    files.splice(firstIdx, 1);
    files.unshift(first);
  }
  if(last){
    var lastIdx = files.map((m) => {return m.replace(/\\/g,'/');}).indexOf(last);
    if(lastIdx > 0 && lastIdx < files.length-1){
      files.splice(lastIdx, 1);
      files.push(last);
    }
  }

  this.getDirectory = function getDirectory(){
    return dir;
  }

  this.getFiles = function getFiles(){
    return files;
  }

  this.getMochaOptions = function getMochaOptions(){
    return mochaOptions;
  }

  this.exitOnFail = function(){
    return exitOnFail;
  }

  this.write = function write(){
    if(enableLogs){
      Logger.write.apply(this, arguments);
    }
  }

  exports.Configurator = Configurator(parameters);
}


/**
 * Run tests and invoke `fn()` when complete.
 *
 * @param {Function} fn
 */
Kaukau.prototype.run = function run(fn) {

  // attach events to object
  var emitter = new events.EventEmitter();

  var self = this;

  var c = exports.Configurator;

  //function to run Mocha testing
  function runMocha(callback){
    console.log("");

    // set next parameters for the next test
    var count = c.next();
    self.write('info',"Test n°", count);

    self.write('info',"Creating tester... ");
    exports.Tester = new Tester();
    self.write('success',"Tester created");

    var optionsPlus = c.parameters.mochaOptions || {};
    var kaukauOptions = c.parameters.kaukauOptions || {};
    kaukauOptions.files = kaukauOptions.files || [];

    if(!Array.isArray(kaukauOptions.files)){
      kaukauOptions.files = [kaukauOptions.files];
    }

    self.write('info',"Checking parameters ...");

    var options = JSON.parse(JSON.stringify(self.getMochaOptions()));

    if(typeof optionsPlus === 'object'){
      Object.keys(optionsPlus).forEach(
        function(p){
          options[p] = optionsPlus[p];
        }
      );
    }

    self.write('success',"Done checking parameters !");

    console.log("MochaOptions:", options);
    console.log("Test files:", kaukauOptions.files);

    self.write('info',"Creating Mocha instance ... ");
    // Instantiate a Mocha instance.
    var mocha = new Mocha(options);
    self.write('success',"Mocha instance created ! ");

    // if no files were explicitly mentioned, import all the test files
    if(!kaukauOptions.files.length){
      self.getFiles().map(function(file){

        var filename = path.resolve(path.join(self.getDirectory(), file));

        addFile(mocha, filename);
      });
    }
    else{
      // otherwise, only import the mentioned files
      kaukauOptions.files.map(function(file){
        var filename = path.resolve(path.join(self.getDirectory(), file));

        if(fs.statSync(filename).isDirectory()){

          // Searching files in directory
          var subfiles = walkSync(filename).filter(function(file){
              return file.substr(-3) === '.js';
          });

          subfiles.map(function(subfile){
            var subfilename = path.resolve(path.join(filename, subfile));

            addFile(mocha, subfilename);
          });

        }
        else{
          addFile(mocha, filename);
        }
      });
    }

    mocha.run((err) => {
        err = self.exitOnFail() ? err : null;

        if(err){
          self.write("error", "Something went wrong (see message below)");
          console.log(err);
        }

        callback(err);
    })
      .on('test', function(test) {
        emitter.emit('test', test);
      })
      .on('test end', function(test) {
        emitter.emit('test end', test);
      })
      .on('pass', function(test) {
        emitter.emit('pass', test);
      })
      .on('fail', function(test, err) {
        emitter.emit('fail', test);
      })
      .on('end', function() {
          emitter.emit('end');
          self.write('info','Test n°', count, 'done');
      });
  }

  // run Mocha as many time as there are parameters (if parameters is array)
  waterfall(c.all().map(() => {return runMocha;}), function(err, result){
    process.on('exit', function () {
      emitter.emit('done');
      process.exit(err);  // exit with non-zero status if there were failures
    });
  });

  return emitter;
}
