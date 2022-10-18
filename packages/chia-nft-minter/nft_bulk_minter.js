import _ from 'lodash';

export default class NftBulkMinter {
    constructor(wallet) {
        if (_.isNil(wallet)) {
            throw Error('wallet cannot be nil');
        }
        this.wallet = wallet;
    }

    async mint(bulkMintInfo) {
        if (_.isNil(bulk_info.xch_coin_list)) {
            // we need at least a 1 mojo coin to fund the mint operation
            const coin_fee = bulk_info.fee === 0 ? 1 : bulk_info.fee;
            const coins = await this.wallet.select_coins({
                wallet_id: 1, // this is alwasy an xch wallet
                amount: bulk_info.mint_total * coin_fee
            });

            bulk_info.xch_coin_list = coins.coins;
        }

        return await this.wallet.nft_mint_bulk(bulkMintInfo);
    }
}
