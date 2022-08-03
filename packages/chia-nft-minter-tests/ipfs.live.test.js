import chai from 'chai';
import { upload } from '../chia-nft-minter/uploader.js';
import fs from 'fs';
import path from 'path';
import _ from 'lodash';
import { fileURLToPath } from 'url';
import { MetadataFactory } from '../chia-nft-minter/metadata_factory.js';

const expect = chai.expect;

/* jshint ignore:start */
const __dirname = path.dirname(fileURLToPath(import.meta.url));
/* jshint ignore:end */

describe('chia-minter', () => {
    describe('ipfs', () => {
        it('should upload file', async function() {
            this.timeout(30 * 1000);
            const ipfsToken = fs.readFileSync("E:\\tmp\\secrets\\ipfs.test-key.txt").toString();
            const buffer = fs.readFileSync(path.join(__dirname, 'content', 'flower.png'));
            const file = {
                name: 'test-nft-dkackman',
                type: 'image/png',
                content: buffer
            };
            const factory = new MetadataFactory('chia-nft-minter-tests');
            const collectionAttributes = factory.createAttributeArray([['Description', 'This is a test collection']]);
            const collectionMetaData = factory.createCollectionMetadata('test-nft-collection-dkackman', collectionAttributes);

            const nftAttributes = factory.createAttributeArray([['trait_type0', 'trait_value0']]);
            const nftMetadata = factory.createNftMetadata('test-nft-dkackman', collectionMetaData, nftAttributes);

            const result = await upload(file, nftMetadata, ipfsToken);
            expect(result).to.not.equal(null);
            expect(result).to.not.equal(undefined);

            // verify these uri's
            console.log(result);
        });
    });
});
