// example minitng script that can be .loaded into the repl

async function createSimpleNFT(walletId, targetAddress, name, filepath, type) {
    let dataFileInfo = {
        name: name,
        type: type,
        filepath: filepath
    };
    let mintingInfo = {
        wallet_id: walletId,
        target_address: targetAddress,
    };
    let collectionMetaData = metadataFactory.createCollectionMetadata(`${name}-collection`);
    let nftMetadata = metadataFactory.createNftMetadata(name, collectionMetaData);
    await minter.createNftFromFile(dataFileInfo, mintingInfo, nftMetadata);
}
