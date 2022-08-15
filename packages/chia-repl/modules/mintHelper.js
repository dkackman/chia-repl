import fs, { readFile } from 'fs';
import path from 'path';
import mmm from 'mmmagic';
import _ from 'lodash';
import { promisify } from 'util';

export default class MintHelper {
    constructor(minter, metadataFactory) {
        if (_.isNil(minter)) {
            throw Error('minter cannot be nil');
        }
        if (_.isNil(metadataFactory)) {
            throw Error('metadataFactory cannot be nil');
        }

        this.minter = minter;
        this.metadataFactory = metadataFactory;
        this.magic = new mmm.Magic(mmm.MAGIC_MIME_TYPE);
    }

    async mintCollectionFromFolder(walletId, targetAddress, collectionMetaData, folderPath, nftFileExt, fee = 0, royaltyAddress = targetAddress, royaltyPercentage = 0) {
        // this is a link to an Apache 2.0 pdf
        this.minter.licenseFileInfo = { type: 'application/pdf', uri: 'https://bafybeibbnjrv3nwlq6gnx3bd5l2uwozxek4sm6ad4j2gazgv3paouldvai.ipfs.nftstorage.link/license' };

        const spendBundles = [];

        const readdir = promisify(fs.readdir);
        const fileList = await readdir(folderPath);

        let editionNumber = 1;
        const editionTotal = fileList.length;
        for await (let file of fileList.filter(file => path.extname(file).toLowerCase() === nftFileExt)) {
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
    }

    async mintNFT(walletId, targetAddress, fullFilePath, collectionMetaData, editionNumber, editionTotal, fee, royaltyAddress, royaltyPercentage) {
        const detectFile = promisify(this.magic.detectFile);
        const type = await detectFile(fullFilePath);

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
            editionNumber: editionNumber,
            editionTotal: editionTotal,
        };

        let nftMetadataStub = this.metadataFactory.createNftMetadata(dataFileInfo.name, collectionMetaData);
        const metedataFileName = `${path.join(path.dirname(fullFilePath), path.basename(fullFilePath, path.extname(fullFilePath)))}.metadata.json`;

        const readfile = promisify(fs.readfile);
        const metadataFileContents = await readfile(metedataFileName);
        if (metadataFileContents.code === undefined) {
            metadata = JSON.parse(file);
            nftMetadataStub = {
                ...nftMetadataStub,
                ...metadata
            };
        }

        console.log(`Minting ${dataFileInfo.name} (${editionNumber} of ${editionTotal})...`);
        return await this.minter.createNftFromFile(dataFileInfo, mintingInfo, nftMetadataStub);
    }
}
