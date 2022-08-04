import { File, NFTStorage } from 'nft.storage';
import _ from 'lodash';
import ContentHasher from './content_hasher.js';

//
// Adapted from https://github.com/mintgarden-io/mintgarden-studio/blob/main/src/helpers/nft-storage.ts
//
/**
 *
 * @param {Object} dataFile - The data file
 * @param {string} dataFile.name - The data file name
 * @param {string} dataFile.type - The data file MIME type
 * @param {BlobPart} dataFile.content - The data file's contents
 * @param {string} metadataContent - NFT metadata json string
 * @param {string} ipfsToken - nft.storage API token
 * @param {Object} licenseFile - optional license file
 * @param {string} licenseFile.type - The license file MIME type
 * @param {BlobPart} licenseFile.content - The license file contents (contents and uri should be mutally exclusive)
 * @param {string} licenseFile.uri - The remote location of the license
 * @returns An object with the uris and hashes of all of the uploaded content
 */
export default async function upload(dataFile, metadataContent, ipfsToken, licenseFile) {
    if (_.isNil(dataFile)) {
        throw Error('dataFile cannot be nil');
    }
    if (_.isNil(metadataContent)) {
        throw Error('metadataContent cannot be nil');
    }
    if (_.isNil(ipfsToken)) {
        throw Error('ipfsToken cannot be nil');
    }

    const files = [];

    files.push(new File([dataFile.content], dataFile.name, { type: dataFile.type }));
    files.push(new File([metadataContent], 'metadata.json', { type: 'application/json' }));
    if (!_.isNil(licenseFile) && licenseFile.content !== undefined) {
        // if the licenseFile has content upload that with the nft
        files.push(new File([licenseFile.content], 'license', { type: licenseFile.type }));
    }

    const client = new NFTStorage({ token: ipfsToken });
    const cid = await client.storeDirectory(files);
    const hasher = new ContentHasher();

    // this is awkward - refactor it
    let licenseUris;
    let licenseHash;
    if (!_.isNil(licenseFile)) {
        if (licenseFile.content !== undefined) {
            // in this case we uploaded the license with the nft
            licenseUris = [
                `https://nftstorage.link/ipfs/${cid}/license`,
                `ipfs://${cid}/license`,
            ];
            licenseHash = hasher.hash(licenseFile.content);
        } else {
            // in this case the license is elsewhere so refrence it and its content hash
            licenseUris = [licenseFile.uri];
            licenseHash = await hasher.hashUriContent(licenseFile.uri);
        }
    }

    return {
        dataUris: [
            `https://nftstorage.link/ipfs/${cid}/${encodeURIComponent(dataFile.name)}`,
            `ipfs://${cid}/${encodeURIComponent(dataFile.name)}`,
        ],
        dataHash: hasher.hash(dataFile.content),
        metadataUris: [
            `https://nftstorage.link/ipfs/${cid}/metadata.json`,
            `ipfs://${cid}/metadata.json`
        ],
        metadataHash: hasher.hash(metadataContent),
        licenseUris: licenseUris,
        licenseHash: licenseHash,
    };
}
