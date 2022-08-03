export function createMintInfo(ipfsToken) {
    return {
        ipfsToken: ipfsToken, // NFT.storage - https://nft.storage/docs/#get-an-api-token
        walletIndex: 1, // EDIT
        royaltyAddress: '', // EDIT
        nftAddress: '', // EDIT
        royaltyPercent: 250, // 2.5%
        walletFingerprint: '', // EDIT
        fee: '.00000001', // EDIT
        collectionName: '', // EDIT
        collectionDescription: '', // EDIT
        collectionTwitter: '', // EDIT
        collectionId: '', // EDIT
    };
}
