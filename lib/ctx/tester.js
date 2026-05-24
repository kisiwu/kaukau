exports = module.exports = Tester;

function Tester(){

  let requestInit = {};

  //where to store the session id
  this.sessionId = "";

  //set request.defaults
  this.setRequestDefaults = function(options){
    requestInit = options || {};
  };

  //update request.defaults
  this.updateRequestDefaults = function(options){
    requestInit = options ? {...requestInit, ...options} : requestInit;
  };

  this.getRequestDefaults = function() {
    return {...requestInit};
  };

  //call request
  this.request = function(input, init){
    return fetch(input, init ? { ...requestInit, ...init } : requestInit);
  };
}
