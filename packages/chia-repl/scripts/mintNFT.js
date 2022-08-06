async function mintNFT(walletId, targetAddress, name, filepath, type, description, traits = [], collectionMetaData = undefined) {
    let dataFileInfo = {
        name: name,
        type: type,
        filepath: filepath
    };
    let mintingInfo = {
        wallet_id: walletId,
        target_address: targetAddress,
        royalty_address: targetAddress,
        royalty_percentage: 250,
        fee: 1000,
    };

    // if no collection passed in create a simple one
    if (collectionMetaData === undefined) {
        collectionMetaData = metadataFactory.createCollectionMetadata(`${name}-collection`,
            [
                ['description', `${description} collection`],
            ]);
    }

    let nftMetadata = metadataFactory.createNftMetadata(name,
        collectionMetaData,
        traits,
        description);

    // this is a link to an Apache 2.0 pdf
    minter.licenseFileInfo = { type: 'application/pdf', uri: 'https://bafybeibbnjrv3nwlq6gnx3bd5l2uwozxek4sm6ad4j2gazgv3paouldvai.ipfs.nftstorage.link/license' };
    await minter.createNftFromFile(dataFileInfo, mintingInfo, nftMetadata);
}
