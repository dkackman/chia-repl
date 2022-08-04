import chai from 'chai';
import { ChiaDaemon } from 'chia-daemon';

const expect = chai.expect;
const connection = {
    host: 'localhost',
    port: 55400,
    key_path: '~/.chia/mainnet/config/ssl/daemon/private_daemon.key',
    cert_path: '~/.chia/mainnet/config/ssl/daemon/private_daemon.crt',
    timeout_seconds: 30,
};

describe('chia-daemon', () => {
    describe('construction', () => {
        it('should not throw', () => {
            const chia = new ChiaDaemon(connection, 'tests');
            expect(chia).to.not.equal(null);
            expect(chia).to.not.equal(undefined);
        });
        it('should throw when no connection is provided', () => {
            expect(() => new ChiaDaemon()).to.throw(Error);
        });
    });
});
