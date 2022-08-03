import crypto from 'crypto';
import { File, NFTStorage } from 'nft.storage';
import _ from 'lodash';

//
// Adapted from https://github.com/mintgarden-io/mintgarden-studio/blob/main/src/helpers/nft-storage.ts
//

export async function upload(file, metadata, ipfsToken) {
    if (_.isNil(file)) {
        throw Error('file cannot be nil');
    }
    if (_.isNil(metadata)) {
        throw Error('metadata cannot be nil');
    }
    if (_.isNil(ipfsToken)) {
        throw Error('ipfsToken cannot be nil');
    }

    const dataFileName = file.name;
    const dataContent = file.content;
    const dataHash = crypto.createHash('sha256').update(dataContent).digest('hex');
    const dataFile = new File([dataContent], dataFileName, { type: file.type });

    const metadataString = JSON.stringify(metadata, null, 2);
    const metadataHash = crypto.createHash('sha256').update(metadataString).digest('hex');
    const metadataFile = new File([metadataString], 'metadata.json', {
        type: 'application/json',
    });

    try {
        const client = new NFTStorage({
            token: ipfsToken,
        });
        const cid = await client.storeDirectory([dataFile, metadataFile]);
        return {
            dataUris: [
                `https://nftstorage.link/ipfs/${cid}/${encodeURIComponent(dataFileName)}`,
                `ipfs://${cid}/${encodeURIComponent(dataFileName)}`,
            ],
            dataHash,
            cid: cid,
            metadataUris: [`https://nftstorage.link/ipfs/${cid}/metadata.json`, `ipfs://${cid}/metadata.json`],
            metadataHash,
        };
    } catch (e) {
        console.log(e);
        throw e;
    }
}
