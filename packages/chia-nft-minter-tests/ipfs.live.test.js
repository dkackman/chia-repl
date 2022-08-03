import chai from 'chai';
import { upload } from '../chia-nft-minter/uploader.js';
import fs from 'fs';
import path from 'path';
import _ from 'lodash';
import { fileURLToPath } from 'url';

const expect = chai.expect;

/* jshint ignore:start */
const __dirname = path.dirname(fileURLToPath(import.meta.url));
/* jshint ignore:end */

describe('chia-minter', () => {
    describe('ipfs', () => {
        it('should upload file _DEBUG_', async function() {
            this.timeout(30 * 1000);
            const ipfsToken = fs.readFileSync("E:\\tmp\\secrets\\ipfs.test-key.txt").toString();
            const buffer = fs.readFileSync(path.join(__dirname, 'content', 'flower.png'));
            const file = {
                name: 'test-nft-dkackman',
                type: 'png',
                content: buffer
            };
            const metadata = {
                'format': 'CHIP-0007',
                'name': 'test-nft-dkackman',
                'description': 'this is a test nft',
                'sensitive_content': false,
                'collection': {
                    'name': 'test-nft-collection-dkackman',
                    'id': 'test-nft-collection-dkackman',
                    'attributes': [{
                        'type': 'Description',
                        'value': 'this is a test nft collection'
                    }
                    ]
                },
                'attributes': [{
                    'trait_type': 'trait-1', // EDIT ME
                    'value': 'trait1'
                },
                {
                    'trait_type': 'trait-2', // EDIT ME
                    'value': 'trait2'
                },
                {
                    'trait_type': 'trait-3', // EDIT ME
                    'value': 'trait3'
                },
                ]
            };

            const result = await upload(file, metadata, ipfsToken);
            expect(result).to.not.equal(null);
            expect(result).to.not.equal(undefined);
        });
    });
});
