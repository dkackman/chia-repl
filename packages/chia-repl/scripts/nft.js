let dataFileInfo = {
    name: 'chia-repl-nft',
    type: 'image/jpg',
    filepath: 'E:\\nft\\flower.jpg'
};

let mintingInfo = {
    wallet_id: 2,
    target_address: 'txch10kn82kl6hqv47qzeh4ugmqjr5mmdcnrlymfx8wl9nrhhkyxnzfkspna7l9',
    royalty_address: 'txch10kn82kl6hqv47qzeh4ugmqjr5mmdcnrlymfx8wl9nrhhkyxnzfkspna7l9',
    royalty_percentage: 250,
    fee: 1000,
};

let collectionMetaData = metadataFactory.createCollectionMetadata('chia-repl-nft=collection',
    [
        ['description', 'NFT collection minted by chia-repl'],
        ['twitter', '@dkackman'],
        ['website', 'https://github.com/dkackman/chia-repl'],
    ]);
let nftMetadata = metadataFactory.createNftMetadata('test-nft-by-you',
    collectionMetaData,
    [
        ['trait_type', 'number'],
        ['twitter', '@dkackman'],
        ['website', 'https://github.com/dkackman/chia-repl'],
    ],
    'That picture is from my garden');

minter.licenseFileInfo = { type: 'application/pdf', filepath: 'E:\\nft\\Apache_License_v.2.0.pdf' };
await minter.createNftFromFile(dataFileInfo, mintingInfo, nftMetadata);
