import chai from 'chai';
import fs from 'fs';
import path from 'path';
import _ from 'lodash';
import { fileURLToPath } from 'url';
import { NftMinter } from '../chia-nft-minter/nft_minter.js';
import { MetadataFactory } from '../chia-nft-minter/metadata_factory.js';
import { ChiaDaemon } from 'chia-daemon';

const expect = chai.expect;

/* jshint ignore:start */
const __dirname = path.dirname(fileURLToPath(import.meta.url));
/* jshint ignore:end */

describe('chia-minter', () => {
    describe('minting', () => {
        it('the full workflow', async function () {
            this.timeout(30 * 1000);

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
            expect(connected).to.equal(true); // short circuit the test if we can't connect

            const ipfsToken = fs.readFileSync("E:\\tmp\\secrets\\ipfs.test-key.txt").toString();

            const minter = new NftMinter(chia.services.wallet, ipfsToken);
            const result = await minter.createNftFromFile(fileInfo, mintingInfo, nftMetadata);

            expect(result).to.not.equal(null);
            expect(result).to.not.equal(undefined);

            console.log(result);
        });
    });
});
