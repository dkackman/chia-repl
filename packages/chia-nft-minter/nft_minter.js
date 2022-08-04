import _ from 'lodash';
import { upload } from './uploader.js';
import fs from 'fs';

class NftMinter {
    /**
     *
     * @param {Object} wallet - the chia wallet RPC service (retreived from the ChiaDaemon)
     * @param {string} ipfsToken - nft.storage API token
     * @param {Object} licenseFileInfo - optional information about the license (will be uploaded with each NFT file if present)
     */
    constructor(wallet, ipfsToken, licenseFileInfo) {
        if (_.isNil(wallet)) {
            throw Error('wallet cannot be nil');
        }
        if (_.isNil(ipfsToken)) {
            throw Error('ipfsToken cannot be nil');
        }
        this.wallet = wallet;
        this.ipfsToken = ipfsToken;
        this.licenseFileInfo = licenseFileInfo;
    }

    /**
     *
     * @param {Object} dataFileInfo - information about the NFT data file
     * @param {Object} mintingInfo - Information about the minting
     * @param {string} metadata - NFT metadata
     * @returns A spend_bundle
     */
    async createNftFromFile(dataFileInfo, mintingInfo, metadata) {

        if (_.isNil(dataFileInfo)) {
            throw Error('fileInfo cannot be nil');
        }
        if (_.isNil(mintingInfo)) {
            throw Error('mintingInfo cannot be nil');
        }
        if (_.isNil(metadata)) {
            throw Error('metadata cannot be nil');
        }


        const dataFile = unpackFileInfo(dataFileInfo);
        const licenseFile = unpackFileInfo(this.licenseFileInfo);

        const ipfsData = await upload(dataFile, metadata, this.ipfsToken, licenseFile);
        return await this.createNftFromIpfs(mintingInfo, ipfsData);
    }

    /**
     *
     * @param {Object} mintingInfo - Information about the minting
     * @param {Object} ipfsData - Uris and hashes for the uploaded content
     * @returns A spend_bundle
     */
    async createNftFromIpfs(mintingInfo, ipfsData) {
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

        return await this.wallet.nft_mint_nft(payload);
    }
}

const _NftMinter = NftMinter;
export { _NftMinter as NftMinter };

function unpackFileInfo(fileInfo) {
    if (fileInfo === undefined) {
        return undefined;
    }

    return {
        name: fileInfo.name,
        type: fileInfo.type,
        content: fs.readFileSync(fileInfo.filepath),
    };
}
