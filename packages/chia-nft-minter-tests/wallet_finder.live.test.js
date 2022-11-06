import chai from 'chai';
import _ from 'lodash';
import getMintingWallet from 'chia-nft-minter/getMintingWallet';
import { ChiaDaemon } from 'chia-daemon';

const expect = chai.expect;

describe('chia-minter', () => {
    describe('nft-wallet-finder', () => {
        it('should find the first nft wallet', async function () {
            this.timeout(30 * 1000);
            const connection = {
                host: 'chiapas',
                port: 55400,
                key_path: '~/.chia/mainnet - chiapas/config/ssl/daemon/private_daemon.key',
                cert_path: '~/.chia/mainnet - chiapas/config/ssl/daemon/private_daemon.crt',
                timeout_seconds: 30,
            };
            const chia = new ChiaDaemon(connection, 'chia-nft-minter-tests');
            const connected = await chia.connect();
            expect(connected).to.equal(true); // short circuit the test if we can't connect

            const mintingWallet = await getMintingWallet(
                chia.services.wallet,
                chia.services.full_node);
            // this is specific to my test nodde
            expect(mintingWallet.wallet_id).to.equal(3);
        });
        it('should find the nft wallet linked to a did', async function () {
            this.timeout(300 * 1000);
            const connection = {
                host: 'chiapas',
                port: 55400,
                key_path: '~/.chia/mainnet - chiapas/config/ssl/daemon/private_daemon.key',
                cert_path: '~/.chia/mainnet - chiapas/config/ssl/daemon/private_daemon.crt',
                timeout_seconds: 30,
            };
            const chia = new ChiaDaemon(connection, 'chia-nft-minter-tests');
            const connected = await chia.connect();
            expect(connected).to.equal(true); // short circuit the test if we can't connect

            const mintingWallet = await getMintingWallet(
                chia.services.wallet,
                chia.services.full_node,
                'did:chia:1w4tuxuw622qncpqlwl5j4s62zm9ju5dvgyjl0q7fvqtfnmwjffmqwfkqjg');

            expect(mintingWallet.wallet_id).to.equal(3); // this is specific to my test nodde
        });
        it('should throw an error when no did nft wallet is found', async function () {
            this.timeout(30 * 1000);
            const connection = {
                host: 'chiapas',
                port: 55400,
                key_path: '~/.chia/mainnet - chiapas/config/ssl/daemon/private_daemon.key',
                cert_path: '~/.chia/mainnet - chiapas/config/ssl/daemon/private_daemon.crt',
                timeout_seconds: 30,
            };
            const chia = new ChiaDaemon(connection, 'chia-nft-minter-tests');
            const connected = await chia.connect();
            expect(connected).to.equal(true); // short circuit the test if we can't connect

            await expectThrowsAsync(getMintingWallet, [
                chia.services.wallet,
                chia.services.full_node,
                'NO_DID_HERE'
            ]);
        });
    });
});


const expectThrowsAsync = async (
    method,
    params,
    message
) => {
    let err = null;
    try {
        await method(...params);
    } catch (error) {
        err = error;
    }
    if (message) {
        expect(err.message).to.be.equal(message);
    } else {
        expect(err).to.be.an("Error");
    }
};
