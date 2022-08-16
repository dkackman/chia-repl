import chai from 'chai';
import { ContentHasher } from 'chia-nft-minter';
import { fileURLToPath } from 'url';
import path from 'path';

/* jshint ignore:start */
const __dirname = path.dirname(fileURLToPath(import.meta.url));
/* jshint ignore:end */

const expect = chai.expect;

describe('chia-minter', () => {
    describe('hasher', () => {
        it('should hash local file content', async function () {
            this.timeout(30 * 1000);

            const filePath = path.join(__dirname, 'content', 'flower.jpg');

            var hasher = new ContentHasher();
            const hash = await hasher.hashFileContent(filePath);
            expect(hash).to.equal('8cfc885ad68385dfbe0c2c9f88408d4574319e7b580a4ee545e0d60520878f50');
        });
    });
});
