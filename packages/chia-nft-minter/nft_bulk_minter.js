import _ from 'lodash';

export default class NftBulkMinter {
    constructor(wallet, fulllNode, walletId, didCoin) {
        if (_.isNil(wallet)) {
            throw Error('wallet cannot be nil');
        }
        if (_.isNil(fulllNode)) {
            throw Error('fulllNode cannot be nil');
        }

        this.wallet = wallet;
        this.fulllNode = fulllNode;
        this._walletId = walletId;
        this._didCoin = didCoin; // needs to be non-null to mint with a did
    }

    get walletId() { return this._walletId; }
    get didCoin() { return this._didCoin; }

    async mint(bulkMintInfo) {
        if (_.isNil(bulkMintInfo)) {
            throw Error('bulkMintInfo cannot be nil');
        }

        bulkMintInfo.wallet_id = this.walletId;
        bulkMintInfo.mint_from_did = !_.isNil(this.didCoin);
        bulkMintInfo.did_coin = this.didCoin;

        return await this.wallet.nft_mint_bulk(bulkMintInfo);
    }

    async mintAndSubmit(bulkMintInfo) {
        const mint = await this.mint(bulkMintInfo);
        const status = await this.fulllNode.push_tx({
            spend_bundle: mint.spend_bundle,
        });

        return {
            spend_bundle: mint.spend_bundle,
            status: status.status,
        };
    }
}
