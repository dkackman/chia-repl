import _ from 'lodash';
import SecureString from 'secure-string';
import { File, NFTStorage } from 'nft.storage';
import ContentHasher from './content_hasher.js';
import fs from 'fs';

export default class NftUploader {
    /**
     *
     * @param {string} ipfsToken - nft.storage API token
     */
    constructor(ipfsToken) {
        if (_.isNil(ipfsToken)) {
            throw Error('ipfsToken cannot be nil');
        }

        if (!_.isString(ipfsToken)) { // assumed to be a SecureString already
            this.ipfsToken = ipfsToken;
        } else {
            const _ipfsToken = new SecureString();
            for (let i = 0; i < ipfsToken.length; ++i) {
                _ipfsToken.appendCodePoint(ipfsToken.codePointAt(i));
            }
            this.ipfsToken = _ipfsToken;
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

    async delete(cid) {
        let token;
        this.ipfsToken.value(plainText => token = plainText.toString());
        const client = new NFTStorage({ token: token });
        await client.delete(cid);
    }

    unpackFileInfo(fileInfo) {
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
    async upload(dataFile, metadataContent, licenseFile) {
        if (_.isNil(dataFile)) {
            throw Error('dataFile cannot be nil');
        }
        if (_.isNil(metadataContent)) {
            throw Error('metadataContent cannot be nil');
        }

        // metadata content can either be an object to serialize or an already serialized object
        if (!_.isString(metadataContent)) {
            metadataContent = JSON.stringify(metadataContent, null, 2);
        }

        const files = [];

        files.push(new File([dataFile.content], dataFile.name, { type: dataFile.type }));
        files.push(new File([metadataContent], 'metadata.json', { type: 'application/json' }));
        if (!_.isNil(licenseFile) && licenseFile.content !== undefined) {
            // if the licenseFile has content upload that with the nft
            files.push(new File([licenseFile.content], 'license', { type: licenseFile.type }));
        }

        let token;
        this.ipfsToken.value(plainText => token = plainText.toString());
        const client = new NFTStorage({ token: token });
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
