var kaukau = require('../../../lib/kaukau');
var request = require('request');

var expect = require('chai').expect;
var Parameters = kaukau.Parameters;
var Tester = kaukau.Tester;
var Debug = kaukau.Logger.info;

describe('Route 1 sub', function() {

  //considered slow when ...
  /*this.slow(290);

  it('status should be 200', (done) => {
    Tester.request({
      method: 'GET',
      url: parameters.host+'/webhp'
    }, (err, res, body) => {
      expect(err).to.equal(null);
      expect(res.statusCode).to.equal(200);
      Debug(res.statusCode);
      done();
    });
  });*/

  Tester.save({
    method: 'GET',
    url: Parameters('host')+'/webhp'
  });

  it('status should be 200', function(){
    expect(this.err).to.equal(null);
    expect(this.res.statusCode).to.equal(200);
    Debug(Parameters('credentials.email'),this.res.statusCode);
  });
});
