import _ from 'lodash';
import { upload } from './uploader.js';
import fs from 'fs';

export async function createNftFromFile(wallet, fileInfo, mintingInfo, metadata, ipfsToken) {
    if (_.isNil(wallet)) {
        throw Error('wallet cannot be nil');
    }
    if (_.isNil(fileInfo)) {
        throw Error('fileInfo cannot be nil');
    }
    if (_.isNil(mintingInfo)) {
        throw Error('mintingInfo cannot be nil');
    }
    if (_.isNil(metadata)) {
        throw Error('metadata cannot be nil');
    }
    if (_.isNil(ipfsToken)) {
        throw Error('ipfsToken cannot be nil');
    }

    const file = {
        name: fileInfo.name,
        type: fileInfo.type,
        content: fs.readFileSync(fileInfo.filepath)
    };
    const ipfsData = await upload(file, metadata, ipfsToken);
    return await createNftFromIpfs(wallet, mintingInfo, ipfsData);
}

export async function createNftFromIpfs(wallet, mintingInfo, ipfsData) {
    if (_.isNil(wallet)) {
        throw Error('wallet cannot be nil');
    }
    if (_.isNil(mintingInfo)) {
        throw Error('mintingInfo cannot be nil');
    }
    if (_.isNil(ipfsData)) {
        throw Error('ipfsData cannot be nil');
    }

    const payload = {
        wallet_id: mintingInfo.wallet_id,
        uris: ipfsData.dataUris,
        hash: ipfsData.dataHash,
        meta_uris: ipfsData.metadataUris,
        meta_hash: ipfsData.metadataHash,

        royalty_address: _.get(mintingInfo, 'royalty_address', null),
        target_address: _.get(mintingInfo, 'target_address', null),
        edition_number: _.get(mintingInfo, 'edition_number', 1),
        edition_total: _.get(mintingInfo, 'edition_total', 1),
        royalty_percentage: _.get(mintingInfo, 'royalty_percentage', 0),
        did_id: _.get(mintingInfo, 'did_id', null),
        fee: _.get(mintingInfo, 'fee', 0),
        license_uris: _.get(mintingInfo.licenseUris, null),
        license_hash: _.get(mintingInfo.licenseHash, null),
    };

    return await wallet.nft_mint_nft(payload);
}
