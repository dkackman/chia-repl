import _ from 'lodash';
import upload from './upload.js';
import fs from 'fs';
import SecureString from 'secure-string';
export default class NftMinter {
    /**
     *
     * @param {Object} wallet - the chia wallet RPC service (retreived from the ChiaDaemon)
     * @param {string} ipfsToken - nft.storage API token
     */
    constructor(wallet, ipfsToken) {
        if (_.isNil(wallet)) {
            throw Error('wallet cannot be nil');
        }
        if (_.isNil(ipfsToken)) {
            throw Error('ipfsToken cannot be nil');
        }

        this.wallet = wallet;
        this.ipfsToken = new SecureString();
        for (let i = 0; i < ipfsToken.length; ++i) {
            this.ipfsToken.appendCodePoint(ipfsToken.codePointAt(i));
        }
    }

    /**
     * Location and mime type of the optional license file.
     * If filepath is populated that file Will be uploaded with each NFT
     * otherwise referenced by the uri.
     */
    get licenseFileInfo() { return this._licenseFileInfo; }
    /**
     * @param {Object} value
     * @param {string} value.type - the MIME type of the license file
     * @param {string} value.filepath - the full path to the license file
     * @param {string} value.uri - the remote uri of the license file
     */
    set licenseFileInfo(value) { this._licenseFileInfo = value; }

    /**
     *
     * @param {Object} dataFileInfo - information about the NFT data file
     * @param {Object} mintingInfo - Information about the minting
     * @param {Object} metadata - NFT metadata object
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

        let token;
        this.ipfsToken.value(plainText => token = plainText.toString());
        const ipfsData = await upload(dataFile, JSON.stringify(metadata, null, 2), token, licenseFile);
        try {
            return await this.createNftFromIpfs(mintingInfo, ipfsData);
        }
        catch (e) {
            // TODO figure out how to delete the uploaded files.
            console.log('Files uploaded but NFT creation failed');
            console.log(ipfsData);

            throw e;
        }
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
            uris: ipfsData.dataUris,
            hash: ipfsData.dataHash,
            meta_uris: ipfsData.metadataUris,
            meta_hash: ipfsData.metadataHash,
            license_uris: _.get(ipfsData, 'licenseUris', undefined),
            license_hash: _.get(ipfsData, 'licenseHash', undefined),

            wallet_id: mintingInfo.wallet_id,
            royalty_address: _.get(mintingInfo, 'royalty_address', undefined),
            target_address: _.get(mintingInfo, 'target_address', undefined),
            edition_number: _.get(mintingInfo, 'edition_number', 1),
            edition_total: _.get(mintingInfo, 'edition_total', 1),
            royalty_percentage: _.get(mintingInfo, 'royalty_percentage', 0),
            did_id: _.get(mintingInfo, 'did_id', undefined),
            fee: _.get(mintingInfo, 'fee', 0),
        };

        return await this.wallet.nft_mint_nft(payload);
    }
}

function unpackFileInfo(fileInfo) {
    if (fileInfo === undefined) {
        return undefined;
    }

    // the fileInfo might have either a local file path or a uri
    return {
        name: fileInfo.name,
        type: fileInfo.type,
        content: fileInfo.filepath !== undefined ? fs.readFileSync(fileInfo.filepath) : undefined,
        uri: fileInfo.uri,
    };
}
