import _ from 'lodash';
import fs from 'fs';
import SecureString from 'secure-string';
import { File, NFTStorage } from 'nft.storage';
import ContentHasher from './content_hasher.js';

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
        const _ipfsToken = new SecureString();
        for (let i = 0; i < ipfsToken.length; ++i) {
            _ipfsToken.appendCodePoint(ipfsToken.codePointAt(i));
        }
        this.ipfsToken = _ipfsToken;
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
        console.log(`Uploading ${dataFile.name}...`);

        const ipfsData = await this.upload(dataFile, JSON.stringify(metadata, null, 2), token, licenseFile);
        try {
            console.log(`Minting ${dataFile.name}...`);

            return await this.createNftFromIpfs(mintingInfo, ipfsData);
        }
        catch (e) {
            console.log('Files uploaded but NFT creation failed.\nUndoing upload.');
            const client = new NFTStorage({ token: token });
            await client.delete(ipfsData.cid);

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
    async upload(dataFile, metadataContent, ipfsToken, licenseFile) {
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
                // in this case the license is elsewhere so reference it and its content hash
                licenseUris = [licenseFile.uri];
                licenseHash = await hasher.hashUriContent(licenseFile.uri);
            }
        }

        return {
            cid: cid,
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
