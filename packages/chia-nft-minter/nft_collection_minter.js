import _ from 'lodash';
import NftBulkMinter from './nft_bulk_minter.js';

export default class NftCollectionMinter {
    constructor(wallet, walletId, fee = 0, royaltyAddress = '', royaltyPercentage = 0) {
        if (_.isNil(wallet)) {
            throw Error('wallet cannot be nil');
        }

        this.wallet = wallet;
        this.walletId = walletId;
        this.fee = fee;
        this.royaltyAddress = royaltyAddress;
        this.royaltyPercentage = royaltyPercentage;
    }

    createMintInfo(collection, nftInfos) {
        if (_.isNil(collection)) {
            throw Error('collection cannot be nil');
        }
        if (_.isNil(nftInfos)) {
            throw Error('nftInfos cannot be nil');
        }
        if (!_.isArray(nftInfos)) {
            throw Error('nftInfos must be an array');
        }
        if (nftInfos.length > 25) {
            throw Error('Only collection of 25 or less supported right now');
        }
        return {
            wallet_id: this.walletId,
            royalty_address: this.royaltyPercentage > 0 ? this.royaltyAddress : undefined,
            royalty_percentage: this.royaltyPercentage,
            fee: this.fee,
            metadata_list: nftInfos,
            mint_number_start: 1,
            mint_total: nftInfos.length,
        };
    }

    async mint(mintInfo) {
        if (_.isNil(mintInfo)) {
            throw Error('mintInfo cannot be nil');
        }

        const minter = new NftBulkMinter(this.wallet);
        return await minter.mint(mintInfo);
    }
}
