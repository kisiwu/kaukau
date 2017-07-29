var indent = 0;

function arrayToString(arr){
            return Array.from(arr).map(function(x){
                if(Array.isArray(x)){
                    return "["+arrayToString(x)+"]";
                }
                else if(typeof x === "object"){
                    return JSON.stringify(x);
                }
                else{
                    return x;
                }
            }).join(" ");
}

function doLog(colorNumber, name, args){
    var stream = process.stdout;
    var indentString = (new Array(indent)).join(" ");
    stream.write(indentString+'Kaukau \x1b['+ colorNumber +'m'+ name +'\x1b[0m : \x1b['+ colorNumber +'m');
    var line = arrayToString(args);
    stream.write(line + "\x1b[0m" + "\n");

}

module.exports = (function(){

    var self = this;

    self.log = function(){
        doLog(0, 'log', arguments);
    };

    self.info = function(){
        doLog(36, 'info', arguments);
    };

    self.debug = function(){
        doLog(45, 'debug', arguments);
    };

    self.warn = function(){
        doLog(33, 'warn',arguments);
    };

    self.error = function(){
        doLog(31, 'error',arguments);
    };

    self.silly = function(){
        doLog(2, 'silly',arguments);
    };

    self.write = function(){
      var args = Array.from(arguments);
      if(args.length > 0){
        var fName = args.shift();
        if(typeof self[fName] === 'function'){
          return self[fName].apply(this, args);
        }
      }
      return self.log.apply(this, arguments);
    };

    self.indent = function(value){
      indent = isNaN(value) ? indent : value;
    };

    return self;

})();