import chai from 'chai';
import path from 'path';
import _ from 'lodash';
import { fileURLToPath } from 'url';
import BulkNftMinter from '../chia-nft-minter/nft_bulk_minter.js';
import NftCollectionMinter from '../chia-nft-minter/nft_collection_minter.js';
import { NftUploader, MetadataFactory } from 'chia-nft-minter';
import { ChiaDaemon } from 'chia-daemon';
import fs from 'fs';
import { createCanvas } from 'canvas';

const expect = chai.expect;

/* jshint ignore:start */
const __dirname = path.dirname(fileURLToPath(import.meta.url));
/* jshint ignore:end */

describe('chia-minter', () => {
    describe('bulk-minting', () => {
        it('mint a set of NFTs with one nft_mint_bulk', async function () {
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
    describe('collection-minting', () => {
        it('mint an entire collection in one go _DEBUG_', async function () {
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

            const licenseFileInfo = {
                type: 'application/pdf',
                filepath: path.join(__dirname, 'content', 'Apache_License_v.2.0.pdf')
            };

            const baseName = new Date().toISOString();
            const factory = new MetadataFactory('chia-nft-bulk-minter-tests');
            const collectionMetaData = factory.createCollectionMetadata(baseName);

            const ipfsToken = fs.readFileSync("C:\\tmp\\secrets\\ipfs.test-key.txt").toString();
            const uploader = new NftUploader(ipfsToken);

            const licenseFile = uploader.unpackFileInfo(licenseFileInfo);
            const timer = ms => new Promise(res => setTimeout(res, ms));
            const mint_total = 25;
            const nftList = [];
            for (let i = 1; i <= mint_total; i++) {
                console.log(`making nft ${i}...`);
                const image = makeImage(i.toString());
                const fileNumber = `${i.toString().padStart(2, '0')}`;
                const nftMetadata = factory.createNftMetadata(`${baseName} #${fileNumber}`, collectionMetaData);

                const nftFile = {
                    name: `${fileNumber}.png`,
                    type: 'image/png',
                    content: image,
                };
                const ipfs = await uploader.upload(nftFile, nftMetadata, licenseFile);

                nftList.push({
                    uris: ipfs.dataUris,
                    hash: ipfs.dataHash,
                    meta_uris: ipfs.metadataUris,
                    meta_hash: ipfs.metadataHash,
                    license_uris: ipfs.licenseUris,
                    license_hash: ipfs.licenseHash,
                    edition_number: i,
                    edition_total: mint_total,
                });
                await timer(100); // to prevent spamming nft.storage
            }

            console.log(`minting...`);
            const collectionMinter = new NftCollectionMinter(
                chia.services.wallet,
                6,
                10,
                "txch1f7r8hk7hwvqwr977ftxkdllvjgagm76cdf0yydht7s6za6nfzk0q8rcy53",
                250);
            const bulk_info = collectionMinter.createMintInfo(collectionMetaData, nftList);
            const mint = await collectionMinter.mint(bulk_info);
            expect(_.isNil(mint)).to.equal(false);
            expect(mint.success).to.equal(true);

            console.log(`transacting...`);
            const push = await chia.services.full_node.push_tx({
                spend_bundle: mint.spend_bundle,
            });
            expect(_.isNil(push)).to.equal(false);
            expect(push.status).to.equal('SUCCESS');
        });

        function makeImage(text) {
            const canvas = createCanvas(200, 200);
            const ctx = canvas.getContext('2d');

            ctx.font = '150px Impact';
            ctx.fillText(text, 50, 160);

            return canvas.toBuffer('image/png');
        }
    });
});
