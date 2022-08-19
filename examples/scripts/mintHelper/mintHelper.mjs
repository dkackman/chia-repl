import { readdir, readFile } from 'fs/promises';
import path from 'path';
import mmm from 'mmmagic';
import _ from 'lodash';

export default class MintHelper {
    constructor(context) {
        if (_.isNil(context)) {
            throw Error('context cannot be nil');
        }
        if (_.isNil(context.minter)) {
            throw Error('context.minter cannot be nil');
        }
        if (_.isNil(context.metadataFactory)) {
            throw Error('context.metadataFactory cannot be nil');
        }

        this.minter = context.minter;
        this.metadataFactory = context.metadataFactory;
        this.log = context.log;
        this.magic = new mmm.Magic(mmm.MAGIC_MIME_TYPE);
    }

    async mintCollectionFromFolder(walletId, targetAddress, collectionMetaData, folderPath, nftFileExt, fee = 0, royaltyAddress = targetAddress, royaltyPercentage = 0) {
        // this is a link to an Apache 2.0 pdf
        this.minter.licenseFileInfo = { type: 'application/pdf', uri: 'https://bafybeibbnjrv3nwlq6gnx3bd5l2uwozxek4sm6ad4j2gazgv3paouldvai.ipfs.nftstorage.link/license' };

        const spendBundles = [];
        const fileList = await readdir(folderPath);
        const files = fileList.filter(file => path.extname(file).toLowerCase() === nftFileExt);
        const editionTotal = files.length;

        try {
            let editionNumber = 1;
            for await (const file of asyncIterator(files)) {
                const sb = await this.mintNFT(walletId,
                    targetAddress,
                    path.join(folderPath, file),
                    collectionMetaData,
                    editionNumber,
                    editionTotal,
                    fee,
                    royaltyAddress,
                    royaltyPercentage);

                spendBundles.push(sb);
                editionNumber++;
            }

            return spendBundles;
        } catch (e) {
            console.log(e);
            if (e.message.indexOf('Can\'t select amount higher than our spendable balance') > -1) {
                this.log('Make sure your main wallet is funded and is divided into a number of small coins.', 'warning');
            }
        }

        return [];
    }

    async mintNFT(walletId, targetAddress, fullFilePath, collectionMetaData, editionNumber, editionTotal, fee, royaltyAddress, royaltyPercentage) {
        const type = await new Promise((resolve, reject) => {
            this.magic.detectFile(fullFilePath, (err, result) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(result);
                }
            });
        });

        let dataFileInfo = {
            name: path.basename(fullFilePath, path.extname(fullFilePath)),
            type: type,
            filepath: fullFilePath
        };

        let mintingInfo = {
            wallet_id: walletId,
            target_address: targetAddress,
            royalty_address: royaltyAddress,
            royalty_percentage: royaltyPercentage,
            fee: fee,
            edition_number: editionNumber,
            edition_total: editionTotal,
        };

        const metadata = await getMetadata(this.metadataFactory.createNftMetadata(dataFileInfo.name, collectionMetaData));
        log(`Minting ${dataFileInfo.name} (${editionNumber} of ${editionTotal})...`);
        return await this.minter.createNftFromFile(dataFileInfo, mintingInfo, metadata);
    }
}

async function* asyncIterator(list) {
    for (let i = 0; i < list.length; i++) {
        yield list[i];
    }
}

async function getMetadata(nftMetadataStub, fullFilePath) {
    try {
        // this will look for a file with the same base name as the main nft file but with '.metadata.json' as an exptension
        // if present it will merge the contents of that file with the metadata stub we created above
        const metadataFileName = `${path.join(path.dirname(fullFilePath), path.basename(fullFilePath, path.extname(fullFilePath)))}.metadata.json`;

        const metadataFileContents = await readFile(metadataFileName);
        metadata = JSON.parse(metadataFileContents);

        return {
            ...nftMetadataStub,
            ...metadata
        };
    } catch {
        console.debug(`No metadata file for ${fullFilePath}`);
    }

    return nftMetadataStub;
}
