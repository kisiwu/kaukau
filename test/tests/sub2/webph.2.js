var expect = require('chai').expect;

describe('Route 1 sub2', function() {

  let {params, logger, tester} = this.ctx.kaukau;

  //console.log(this.ctx.kaukau);
  //console.log(this.ctx.kaukau.log);


  //considered slow when ...
  /*this.slow(290);

  it('status should be 200', (done) => {
    tester.request({
      method: 'GET',
      url: params('host')+'/webhp'
    }, (err, res, body) => {
      expect(err).to.equal(null);
      expect(res.status).to.equal(200);
      log(res.status);
      done();
    });
  });*/

  tester.save({
    method: 'GET',
    url: params('host')+'/webhp'
  });

  it('status should be 200', function(){
    logger.info(params('credentials.email'));
    expect(this.err).to.equal(null);
    expect(this.res.status).to.equal(200);
  });
});
