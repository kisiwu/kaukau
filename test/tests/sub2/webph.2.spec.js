var expect = require('chai').expect;

describe('Route 1 sub2 spec', function() {

  let {params, logger, tester} = this.ctx.kaukau;

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
      expect(res.status).to.equal(200);
      log(res.status);
      done();
    });
  });*/

  tester.setRequestDefaults({ method: 'GET' });

  it('status should be 200', async function () {
    const res = await tester.request(params('host') + '/webhp')
    logger.info(params('credentials.email'));
    expect(res.status).to.equal(200);
  });
});
