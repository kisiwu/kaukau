var request = require('axios');
var requestMocha = require('request-mocha');

exports = module.exports = Tester;

function Tester(){

  var requestDefaults = {};
  var req = request.create();
  var getCallbackStyle = function () {
    return function callbackStyleFn(options, fn) {
      req(options)
        .then(function (response) {
          fn(null, response, response ? response.data : undefined);
        })
        .catch(function (error) {
          fn(error, error.response, error.response ? error.response.data : undefined);
        });
    };
  };
  var httpUtils = requestMocha(getCallbackStyle());

  //where to store the user session id
  this.sessionId = "";

  //set request.defaults
  this.setRequestDefaults = function(options){
    requestDefaults = options || {};
    req = request.create(requestDefaults);
    httpUtils = requestMocha(getCallbackStyle());
  };

  //update request.defaults
  this.updateRequestDefaults = function(options){
    Object.keys(options).forEach(
      function(p){
        requestDefaults[p] = options[p];
      }
    );
    req = request.create(requestDefaults);
    httpUtils = requestMocha(getCallbackStyle());
  };

  //get httpUtils
  this.httpUtils = function(){
    return httpUtils;
  };

  //get request
  this.getRequest = function(){
    return req;
  };

  //call request
  this.request = function(){
    var args = Array.from(arguments);
    // @TODO: deprecated callback style here.
    // remove it in next version.
    // callback style is only good for "httpUtils"
    if(args.length == 2 && typeof args[1] == 'function') {
      return getCallbackStyle()(args[0], args[1]);
    }
    return req.apply(this, arguments);
  };

  //request and saves response to use as 'this' in suites
  this.save = function(){
    var args = arguments;
    return before('save',function(done){
      httpUtils._save.apply(this, args).call(this, done);
    });
  }
}
