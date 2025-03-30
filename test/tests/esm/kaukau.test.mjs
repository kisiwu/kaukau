import { expect } from "chai";

describe('kaukau simple esm test', function(){

    let {params, logger, tester} = this.ctx.kaukau;

    it('should pass', () => {
        logger.log('params("id")', params('id'));
        expect(params('id')).to.be.a('number')
        //logger.log('logger', logger);
        //logger.log('tester', tester);
    })

})