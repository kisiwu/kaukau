var kaukau = require('../../lib/kaukau');
var request = require('request');

var expect = kaukau.expect;
var parameters = kaukau.Configurator.parameters;
var Tester = kaukau.Tester;
var Debug = kaukau.Logger.info;

describe('Route 1', function() {

  //considered slow when ...
  this.slow(290);

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
  });
});
