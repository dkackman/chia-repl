import chai from 'chai';
import { MessageQueue } from 'chia-bot';
import { ChiaDaemon } from 'chia-daemon';
import _ from 'lodash';

const expect = chai.expect;

const valid_connection = {
    host: 'chiapas',
    port: 55400,
    key_path: '~/.chia/mainnet - chiapas/config/ssl/daemon/private_daemon.key',
    cert_path: '~/.chia/mainnet - chiapas/config/ssl/daemon/private_daemon.crt',
    timeout_seconds: 10,
};

describe('chia-bot', () => {
    describe('MessageQueue', () => {
        it('should throw when services arent provided', function () {
            let q;
            expect(() => q = new MessageQueue()).to.throw();
        });
    });
});
