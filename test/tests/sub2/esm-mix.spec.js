import { expect } from "chai"; // ESM import


describe('ESM mix in a .js file - should run for all parameters when isolated', function () {

    const { params, logger, tester } = this.ctx.kaukau;

    tester.setRequestDefaults({ method: 'GET' });

    it('status should be 200', async function () {
        const res = await tester.request(params('host') + '/webhp')
        logger.info(params('credentials.email'));
        expect(res.status).to.equal(200);
    });
});
