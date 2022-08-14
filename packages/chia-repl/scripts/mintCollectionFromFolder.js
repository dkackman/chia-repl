
async function mintNFT(walletId, targetAddress, fullFilePath, collectionMetaData, editionNumber, editionTotal, fee, royaltyAddress, royaltyPercentage) {
    let dataFileInfo = {
        name: path.getbasename(fullFilePath, path.getextension(fullFilePath)),
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

    let nftMetadataStub = metadataFactory.createNftMetadata(dataFileInfo.name, collectionMetaData);
    const metedataFileName = path.join(path.dirname(fillpath), getbasename(fullFilePath, path.getextension(fullFilePath), '.metadata.json'));
    fs.readFile(metedataFileName, 'utf-8', file => {
        metadata = JSON.parse(file);
        nftMetadataStub = {
            ...nftMetadataStub,
            ...metadata
        };
    });

    return await minter.createNftFromFile(dataFileInfo, mintingInfo, nftMetadataStub);
}


async function mintCollectionFromFolder(walletId, targetAddress, collectionMetaData, folderPath, nftFileExt, fee = 0, royaltyAddress = targetAddress, royaltyPercentage = 0) {
    // this is a link to an Apache 2.0 pdf
    minter.licenseFileInfo = { type: 'application/pdf', uri: 'https://bafybeibbnjrv3nwlq6gnx3bd5l2uwozxek4sm6ad4j2gazgv3paouldvai.ipfs.nftstorage.link/license' };

    const spendBundles = [];
    fs.readdir(folderPath, (err, files) => {
        if (err) {
            console.log(err);
        } else {
            let editionNumber = 1;

            files
                .filter(file => path.getextension(file).tolowerCase() === nftFileExt)
                .foreach(file => {
                    const sb = await mintNFT(walletId, targetAddress, path.join(folderPath, file), collectionMetaData, editionNumber, files.length, fee, royaltyAddress, royaltyPercentage);
                    spendBundles.push(sb);
                    editionNumber++;
                });
        }
    });

    return spendBundles;
}
