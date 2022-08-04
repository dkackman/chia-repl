let dataFileInfo = {
    name: 'test-nft-by-you',
    type: 'image/jpg',
    filepath: 'E:\\nft\\flower.jpg'
};
let mintingInfo = {
    wallet_id: 2,
    target_address: 'txch10kn82kl6hqv47qzeh4ugmqjr5mmdcnrlymfx8wl9nrhhkyxnzfkspna7l9',
};
let collectionMetaData = metadataFactory.createCollectionMetadata('test-nft-collection-by-you');
let nftMetadata = metadataFactory.createNftMetadata('test-nft-by-you', collectionMetaData);
await minter.createNftFromFile(dataFileInfo, mintingInfo, nftMetadata);
