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
import getMintingWallet from 'chia-nft-minter/mintingWallet.js';

const expect = chai.expect;

/* jshint ignore:start */
const __dirname = path.dirname(fileURLToPath(import.meta.url));
/* jshint ignore:end */

describe('chia-minter', () => {
    describe('bulk-minting', () => {
        it('mint a set of NFTs with nft_mint_bulk', async function () {
            this.timeout(300 * 1000);
            const bulk_info = {
                royalty_address: "txch1f7r8hk7hwvqwr977ftxkdllvjgagm76cdf0yydht7s6za6nfzk0q8rcy53",
                royalty_percentage: 250,
                fee: 10000000000000,
                metadata_list: [],
                mint_number_start: 1,
                mint_total: 1,
            };
            const ipfs = {
                cid: "bafybeif6oijllffhcqw6poqfva6jyly7rtjoegk5b4yufp4qyc6ikut5uy",
                dataUris: [
                    "https://nftstorage.link/ipfs/bafybeif6oijllffhcqw6poqfva6jyly7rtjoegk5b4yufp4qyc6ikut5uy/test-nft-bulk-dkackman",
                    "ipfs://bafybeif6oijllffhcqw6poqfva6jyly7rtjoegk5b4yufp4qyc6ikut5uy/test-nft-bulk-dkackman",
                ],
                dataHash: "8cfc885ad68385dfbe0c2c9f88408d4574319e7b580a4ee545e0d60520878f50",
                metadataUris: [
                    "https://nftstorage.link/ipfs/bafybeif6oijllffhcqw6poqfva6jyly7rtjoegk5b4yufp4qyc6ikut5uy/metadata.json",
                    "ipfs://bafybeif6oijllffhcqw6poqfva6jyly7rtjoegk5b4yufp4qyc6ikut5uy/metadata.json",
                ],
                metadataHash: "eebb12efa05d3416005a1fbdf8d3ce03a69e2ce692326c8f50796a5a5de84690",
                licenseUris: [
                    "https://nftstorage.link/ipfs/bafybeif6oijllffhcqw6poqfva6jyly7rtjoegk5b4yufp4qyc6ikut5uy/license",
                    "ipfs://bafybeif6oijllffhcqw6poqfva6jyly7rtjoegk5b4yufp4qyc6ikut5uy/license",
                ],
                licenseHash: "738742c6e00fada211d0a16dd472c1b4eb4191e9ca3de85a60e2d53a0252e8c7",
            };
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

            const mintingWallet = await getMintingWallet(
                chia.services.wallet,
                chia.services.full_node);
            const bulkMinter = new BulkNftMinter(
                chia.services.wallet,
                chia.services.full_node,
                mintingWallet.wallet_id);
            const status = await bulkMinter.mintAndSubmit(bulk_info);

            expect(status.status).to.equal('SUCCESS');
        });
        it('mint a DID NFT with nft_mint_bulk', async function () {
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

            const bulk_info = {
                royalty_address: "txch1f7r8hk7hwvqwr977ftxkdllvjgagm76cdf0yydht7s6za6nfzk0q8rcy53",
                royalty_percentage: 250,
                fee: 100000,
                metadata_list: [],
                mint_number_start: 1,
                mint_total: 1,
            };

            const ipfs = await uoloadOne();

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
            const mintingWallet = await getMintingWallet(
                chia.services.wallet,
                chia.services.full_node,
                'did:chia:1w4tuxuw622qncpqlwl5j4s62zm9ju5dvgyjl0q7fvqtfnmwjffmqwfkqjg'
            );
            const bulkMinter = new BulkNftMinter(
                chia.services.wallet,
                chia.services.full_node,
                mintingWallet.wallet_id,
                mintingWallet.did_coin
            );
            const status = await bulkMinter.mintAndSubmit(bulk_info);

            expect(status.status).to.equal('SUCCESS');
        });
    });
    describe('collection-minting', () => {
        it('mint an entire DID collection in one go _DEBUG_', async function () {
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
                console.log(`uploading #${i}...`);
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

            const mintingWallet = await getMintingWallet(
                chia.services.wallet,
                chia.services.full_node,
                'did:chia:1w4tuxuw622qncpqlwl5j4s62zm9ju5dvgyjl0q7fvqtfnmwjffmqwfkqjg'
            );
            const bulkMinter = new NftBulkMinter(
                chia.services.wallet,
                chia.services.full_node,
                mintingWallet.wallet_id,
                mintingWallet.did_coin,
            );
            const collectionMinter = new NftCollectionMinter(
                bulkMinter,
                10, // fee
                "txch1f7r8hk7hwvqwr977ftxkdllvjgagm76cdf0yydht7s6za6nfzk0q8rcy53", //royalty address
                250, //royalty percentage
            );
            const bulk_info = collectionMinter.createMintInfo(nftList);
            const status = await collectionMinter.mintAndSubmit(bulk_info);

            expect(status.status).to.equal('SUCCESS');
        });
        it('mint an entire collection in one go', async function () {
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

            const mintingWallet = await getMintingWallet(
                chia.services.wallet,
                chia.services.full_node
            );
            const bulkMinter = new NftBulkMinter(
                chia.services.wallet,
                chia.services.full_node,
                mintingWallet.wallet_id
            );
            const collectionMinter = new NftCollectionMinter(
                bulkMinter,
                10, // fee
                "txch1f7r8hk7hwvqwr977ftxkdllvjgagm76cdf0yydht7s6za6nfzk0q8rcy53", //royalty address
                250, //royalty percentage
            );
            const bulk_info = collectionMinter.createMintInfo(nftList);
            const status = await collectionMinter.mintAndSubmit(bulk_info);

            expect(status.status).to.equal('SUCCESS');
        });
    });
});

function makeImage(text) {
    const canvas = createCanvas(200, 200);
    const ctx = canvas.getContext('2d');

    ctx.font = '150px Impact';
    ctx.fillText(text, 50, 160);

    return canvas.toBuffer('image/png');
}

async function uoloadOne() {
    const dataFileInfo = {
        name: 'test-nft-bulk-dkackman',
        type: 'image/jpeg',
        filepath: path.join(__dirname, 'content', 'flower.jpg')
    };
    const licenseFileInfo = {
        type: 'application/pdf',
        filepath: path.join(__dirname, 'content', 'Apache_License_v.2.0.pdf')
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
    return await uploader.upload(datafile, json, licenseFile);
}
