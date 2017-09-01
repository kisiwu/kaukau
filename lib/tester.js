var request = require('request');
var requestMocha = require('request-mocha');

exports = module.exports = Tester;

function Tester(){

  var requestDefaults = {};
  var req = request;
  var httpUtils = requestMocha(req);

  //where to store the user session id
  this.sessionId = "";

  //set request.defaults
  this.setRequestDefaults = function(options){
    requestDefaults = options || {};
    req = request.defaults(requestDefaults);
    httpUtils = requestMocha(req);
  };

  //update request.defaults
  this.updateRequestDefaults = function(options){
    Object.keys(options).forEach(
      function(p){
        requestDefaults[p] = options[p];
      }
    );
    req = request.defaults(requestDefaults);
    httpUtils = requestMocha(req);
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
    return req.apply(this, arguments);
  };

  //request and saves response to use as 'this' in suites
  this.save = function(){
    var args = arguments;
    return before('before',function(done){
      httpUtils._save.apply(this, args).call(this, done);
    });
  }
}
