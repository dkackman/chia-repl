import chai from 'chai';
import { ContentHasher } from '../chia-nft-minter/contentHasher.js';

const expect = chai.expect;

describe('chia-minter', () => {
    describe('hasher', () => {
        it('should hash remote file content', async function () {
            this.timeout(30 * 1000);

            const uri = 'https://bafybeigzcazxeu7epmm4vtkuadrvysv74lbzzbl2evphtae6k57yhgynp4.ipfs.nftstorage.link/license.pdf';

            var hasher = new ContentHasher()
            const hash = await hasher.hashUriContent(uri);
            expect(hash).to.equal('2267456bd2cef8ebc2f22a42947b068bc3b138284a587feda2edfe07a3577f50');
        });
    });
});
