var instance;

module.exports = function(args){
  /*if(instance){
    return instance;
  }*/

  var parametersBag = [{}];
  var count;

  if(args && typeof args === 'object' && !Array.isArray(args)){
    args = [args];
  }

  if(Array.isArray(args) && args.length){
    parametersBag = args;
  }

  instance = (function(){

    var that = this;

    that.parameters = {};

    that.all = function all(){
      return parametersBag;
    }

    that.size = function size(){
      return parametersBag.length;
    };

    that.next = function next(){
      if(typeof count === "undefined"){
        count = 0;
      }
      else{
        count++;
      }
      if(count >= parametersBag.length){
        that.parameters = {};
      }
      else{
        that.parameters = parametersBag[count] || {};
        return count + 1;
      }
    };

    return that;
  })();

  return instance;

};
