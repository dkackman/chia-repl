import chai from 'chai';
import { ChiaDaemon } from 'chia-daemon';

const expect = chai.expect;

const bad_connection = {
    host: 'localhost',
    port: 44444,
    key_path: '~/.chia/mainnet/config/ssl/daemon/private_daemon.key',
    cert_path: '~/.chia/mainnet/config/ssl/daemon/private_daemon.crt',
    timeout_seconds: 5,
};

// some tests assume that a daemon is reachable with these details
const valid_connection = {
    host: 'former',
    port: 55400,
    key_path: '~/.chia/mainnet - former/config/ssl/daemon/private_daemon.key',
    cert_path: '~/.chia/mainnet - former/config/ssl/daemon/private_daemon.crt',
    timeout_seconds: 10,
};

describe('chia-daemon', () => {
    describe('connection', () => {
        it('should raise socket-error event on invalid connection', async () => {
            let error = false;

            const chia = new ChiaDaemon(bad_connection, 'tests');
            chia.on('socket-error', e => {
                error = true;
            });
            const connected = await chia.connect();

            expect(error).to.equal(true);
            expect(connected).to.equal(false);
        });
        it('should return true on valid connection', async function () {
            const chia = new ChiaDaemon(valid_connection, 'tests');
            let error = false;
            chia.on('socket-error', e => {
                console.log(e);
                error = true;
            });
            const connected = await chia.connect();
            chia.disconnect();

            expect(error).to.equal(false);
            expect(connected).to.equal(true);
        });
    });
    describe('invocation', () => {
        it('should get all the way to the rpc endpoint', async function () {
            this.timeout(valid_connection.timeout_seconds * 1000);
            const chia = new ChiaDaemon(valid_connection, 'tests');

            const connected = await chia.connect();
            expect(connected).to.equal(true);

            const state = await chia.services.full_node.get_blockchain_state();
            expect(state).to.not.equal(undefined);
            expect(state).to.not.equal(null);

            chia.disconnect();
        });
    });
    describe('listen', () => {
        it('should capture an event', async function () {
            // this test requires the node under test to be plotting or otherwise
            // be triggered to emit an event
            const timeout_milliseconds = 100000;
            this.timeout(timeout_milliseconds + 500);
            const chia = new ChiaDaemon(valid_connection, 'wallet_ui');

            const connected = await chia.connect();
            expect(connected).to.equal(true);

            let event_received = false;
            chia.on('event-message', m => event_received = true);

            const timer = ms => new Promise(res => setTimeout(res, ms));
            const start = Date.now();

            ///stay here intil we receive an event or timeout
            while (!event_received) {
                await timer(100);
                const elapsed = Date.now() - start;
                if (elapsed > timeout_milliseconds) {
                    break;
                }
            }
            chia.disconnect();

            expect(event_received).to.equal(true);
        });
    });
});
