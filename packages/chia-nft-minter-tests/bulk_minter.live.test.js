import chai from 'chai';
import path from 'path';
import _ from 'lodash';
import { fileURLToPath } from 'url';
import BulkNftMinter from '../chia-nft-minter/nft_bulk_minter.js';
import { NftUploader, MetadataFactory } from 'chia-nft-minter';
import { ChiaDaemon } from 'chia-daemon';
import fs from 'fs';

const expect = chai.expect;

/* jshint ignore:start */
const __dirname = path.dirname(fileURLToPath(import.meta.url));
/* jshint ignore:end */

describe('chia-minter', () => {
    describe('bulk-minting', () => {
        it('mint one with nft_mint_bulk _DEBUG_', async function () {
            this.timeout(300 * 1000);

            const dataFileInfo = {
                name: 'test-nft-bulk-dkackman',
                type: 'image/jpeg',
                filepath: path.join(__dirname, 'content', 'flower.jpg')
            };
            const licenseFileInfo = {
                type: 'application/pdf',
                filepath: path.join(__dirname, 'content', 'Apache_License_v.2.0.pdf')
            };

            const bulk_info = {
                wallet_id: 6,
                royalty_address: "txch1f7r8hk7hwvqwr977ftxkdllvjgagm76cdf0yydht7s6za6nfzk0q8rcy53",
                royalty_percentage: 250,
                fee: 10,
                metadata_list: [],
                mint_number_start: 1,
                mint_total: 5,
            };
            const factory = new MetadataFactory('chia-nft-bulk-minter-tests');
            const baseName = new Date().toISOString();
            const collectionMetaData = factory.createCollectionMetadata(baseName);
            const nftMetadata = factory.createNftMetadata(baseName, collectionMetaData);
            const ipfsToken = fs.readFileSync("C:\\tmp\\secrets\\ipfs.test-key.txt").toString();
            const uploader = new NftUploader(ipfsToken);

            const json = JSON.stringify(nftMetadata, null, 2);
            const datafile = uploader.unpackFileInfo(dataFileInfo);
            const licenseFile = uploader.unpackFileInfo(licenseFileInfo);
            const ipfs = await uploader.upload(datafile, json, licenseFile);

            for (let i = 0; i < bulk_info.mint_total; i++) {
                bulk_info.metadata_list.push({
                    uris: ipfs.dataUris,
                    hash: ipfs.dataHash,
                    meta_uris: ipfs.metadataUris,
                    meta_hash: ipfs.metadataHash,
                    license_uris: ipfs.licenseUris,
                    license_hash: ipfs.licenseHash,
                    edition_number: i + 1,
                    edition_total: bulk_info.mint_total,
                });
            }

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

            const bulkMinter = new BulkNftMinter(chia.services.wallet);
            const mint = await bulkMinter.mint(bulk_info);
            expect(_.isNil(mint)).to.equal(false);
            expect(mint.success).to.equal(true);

            if (false) { // this is what the bulk minting tool does - not sure it's needed
                const spend_bundles = [mint.spend_bundle];
                const total_fee_to_pay = spend_bundles.length * fee;
                const fee_coins = await chia.services.wallet.select_coins({
                    amount: total_fee_to_pay,
                    wallet_id: wallet_id,
                    excluded_coins: bulk_info.xch_coin_list,
                });
                const fee_coin = fee_coins[0];
                const fee_tx = await chia.services.wallet.create_signed_transaction({
                    additions: [
                        {
                            amount: fee_coin.amount - fee,
                            puzzle_hash: fee_coin.puzzle_hash,
                        }
                    ],
                    coins: [fee_coin],
                    fee: uint64(fee),
                });
                spend_bundles.push(fee_tx.signed_tx.spend_bundle);
            } else {
                const push = await chia.services.full_node.push_tx({
                    spend_bundle: mint.spend_bundle,
                });
                expect(_.isNil(push)).to.equal(false);
                expect(push.status).to.equal('SUCCESS');
            }
        });
    });
});
