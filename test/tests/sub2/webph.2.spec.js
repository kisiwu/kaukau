var kaukau = require('../../../lib/kaukau');
var request = require('request');

var expect = require('chai').expect;

describe('Route 1 sub2 spec', function() {

  let {params, log, tester} = this.ctx.kaukau;

  //console.log(this.ctx.kaukau);
  //console.log(this.ctx.kaukau.log);


  //considered slow when ...
  /*this.slow(290);

  it('status should be 200', (done) => {
    tester.request({
      method: 'GET',
      url: parameters.host+'/webhp'
    }, (err, res, body) => {
      expect(err).to.equal(null);
      expect(res.statusCode).to.equal(200);
      log(res.statusCode);
      done();
    });
  });*/

  tester.save({
    method: 'GET',
    url: params('host')+'/webhp'
  });

  it('status should be 200', function(){
    log.info(params('credentials.email'));
    expect(this.err).to.equal(null);
    expect(this.res.statusCode).to.equal(200);
  });
});
