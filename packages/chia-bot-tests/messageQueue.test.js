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
        it('should add sender and timestamp _DEBUG_', async function () {
            this.timeout(300 * 100000);
            const chia = new ChiaDaemon(valid_connection, 'tests');
            const connected = await chia.connect();
            expect(connected).to.equal(true);

            const q = new MessageQueue(chia.services.wallet, chia.services.full_node, 'txch');
            const listener = (message) => {
                expect(message.senderAddress).to.not.equal(undefined);
                expect(message.timestamp).to.not.equal(undefined);
                console.log(message.senderAddress);
                console.log(message.timestamp);
                q.stop();
            };

            q.on('message-received', listener);

            await q.listen(1, 10);
            chia.disconnect();
        });
    });
});
