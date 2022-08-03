import chai from 'chai';
import { create_nft_from_file } from '../chia-nft-minter/minter.js';
import fs from 'fs';
import path from 'path';
import _ from 'lodash';
import { fileURLToPath } from 'url';
import { MetadataFactory } from '../chia-nft-minter/metadata_factory.js';
import { ChiaDaemon } from 'chia-daemon';

const expect = chai.expect;

/* jshint ignore:start */
const __dirname = path.dirname(fileURLToPath(import.meta.url));
/* jshint ignore:end */

describe('chia-minter', () => {
    describe('minting', () => {
        it('the full workflow _DEBUG_', async function () {
            this.timeout(30 * 1000);

            const ipfsToken = fs.readFileSync("E:\\tmp\\secrets\\ipfs.test-key.txt").toString();

            const fileInfo = {
                name: 'test-nft-dkackman',
                type: 'image/png',
                filepath: path.join(__dirname, 'content', 'flower.png')
            };

            const factory = new MetadataFactory('chia-nft-minter-tests');
            const collectionMetaData = factory.createCollectionMetadata('test-nft-collection-dkackman');

            const nftMetadata = factory.createNftMetadata('test-nft-dkackman', collectionMetaData);

            const mintingInfo = {
                wallet_id: 2,
                royalty_address: 'txch10kn82kl6hqv47qzeh4ugmqjr5mmdcnrlymfx8wl9nrhhkyxnzfkspna7l9',
                target_address: 'txch10kn82kl6hqv47qzeh4ugmqjr5mmdcnrlymfx8wl9nrhhkyxnzfkspna7l9',
                royalty_percentage: 250,
            };

            const connection = {
                host: '172.25.53.162',
                port: 55400,
                key_path: '~/.chia/mainnet - wsl/config/ssl/daemon/private_daemon.key',
                cert_path: '~/.chia/mainnet - wsl/config/ssl/daemon/private_daemon.crt',
                timeout_seconds: 30,
            };

            const chia = new ChiaDaemon(connection, 'chia-nft-minter-tests');
            const connected = await chia.connect();
            expect(connected).to.equal(true); // this is asserted as part of chia-daemon's test but short circuit this too

            const result = await create_nft_from_file(chia.services.wallet, fileInfo, mintingInfo, nftMetadata, ipfsToken);

            console.log(result);
        });
    });
});
