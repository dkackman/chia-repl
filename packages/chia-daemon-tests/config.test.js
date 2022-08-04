import chai from 'chai';
import { loadUIConfig } from 'chia-daemon';

const expect = chai.expect;

describe('chia-config', () => {
    describe('ui-connection', () => {
        it('should load from yaml', () => {
            const connection = loadUIConfig();
            expect(connection).to.not.equal(null);
            expect(connection).to.not.equal(undefined);
            expect(connection.port).to.equal(55400);
        });
    });
});
