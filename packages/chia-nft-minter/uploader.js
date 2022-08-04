import { File, NFTStorage } from 'nft.storage';
import _ from 'lodash';
import hash from './contentHasher.js';

//
// Adapted from https://github.com/mintgarden-io/mintgarden-studio/blob/main/src/helpers/nft-storage.ts
//
/**
 *
 * @param {Object} dataFile - The data file
 * @param {string} dataFile.name - The data file name
 * @param {string} dataFile.type - The data file MIME type
 * @param {BlobPart} dataFile.content - The data file's contents
 * @param {string} metadata - NFT metadata
 * @param {string} ipfsToken - nft.stroageAPI token
 * @param {Object} licenseFile - optional license file (if present will be uploaded with the NFT)
 * @param {string} licenseFile.type - The license file MIME type
 * @param {BlobPart} licenseFile.content - The license file contents
 * @returns An object with the uris and hashes of all of the uploaded content
 */
export async function upload(dataFile, metadata, ipfsToken, licenseFile) {
    if (_.isNil(dataFile)) {
        throw Error('dataFile cannot be nil');
    }
    if (_.isNil(metadata)) {
        throw Error('metadata cannot be nil');
    }
    if (_.isNil(ipfsToken)) {
        throw Error('ipfsToken cannot be nil');
    }

    const files = [];

    files.push(new File([dataFile.content], dataFile.name, { type: dataFile.type }));

    const metadataContent = JSON.stringify(metadata, null, 2);
    files.push(new File([metadataContent], 'metadata.json', { type: 'application/json' }));

    if (!_.isNil(licenseFile)) {
        files.push(new File([licenseFile.content], 'license', { type: licenseFile.type }));
    }

    const client = new NFTStorage({ token: ipfsToken });
    const cid = await client.storeDirectory(files);

    return {
        dataUris: [
            `https://nftstorage.link/ipfs/${cid}/${encodeURIComponent(dataFileName)}`,
            `ipfs://${cid}/${encodeURIComponent(dataFileName)}`,
        ],
        dataHash: hash(dataFile.content),
        cid: cid,
        metadataUris: [
            `https://nftstorage.link/ipfs/${cid}/metadata.json`,
            `ipfs://${cid}/metadata.json`
        ],
        metadataHash: hash(metadataContent),
        licenseUris: _.isNil(licenseFile) ? null : [
            `https://nftstorage.link/ipfs/${cid}/license`,
            `ipfs://${cid}/license`,
        ],
        licenseHash: _.isNil(licenseFile) ? null : hash(licenseFile.content)
    };
}
