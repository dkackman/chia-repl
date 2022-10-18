import _ from 'lodash';

export default class NftBulkMinter {
    constructor(wallet, fulllNode, walletId, didWalletId = -1) {
        if (_.isNil(wallet)) {
            throw Error('wallet cannot be nil');
        }
        if (_.isNil(fulllNode)) {
            throw Error('fulllNode cannot be nil');
        }
        this.wallet = wallet;
        this.fulllNode = fulllNode;
        this._walletId = walletId;
        this.didWalletId = didWalletId;
    }

    get walletId() { return this._walletId; }

    async mint(bulkMintInfo) {
        if (_.isNil(bulkMintInfo.xch_coin_list)) {
            // we need at least a 1 mojo coin to fund the mint operation
            const coin_fee = bulkMintInfo.fee === 0 ? 1 : bulkMintInfo.fee;
            const coins = await this.wallet.select_coins({
                wallet_id: 1, // this is alwasy an xch wallet
                amount: bulkMintInfo.mint_total * coin_fee
            });

            bulkMintInfo.xch_coin_list = coins.coins;
        }

        bulkMintInfo.wallet_id = this.walletId;
        bulkMintInfo.mint_from_did = this.didWalletId > 0;
        if (bulkMintInfo.mint_from_did) {
            const did = await this.wallet.did_get_did({ wallet_id: this.didWalletId });
            const did_coin_record = await this.fulllNode.get_coin_record_by_name({ name: did.coin_id });
            bulkMintInfo.did_coin = did_coin_record.coin_record.coin;
        }
        return await this.wallet.nft_mint_bulk(bulkMintInfo);
    }
}
