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
        this._didWalletId = didWalletId;
    }

    get walletId() { return this._walletId; }
    get didWalletId() { return this._didWalletId; }

    async mint(bulkMintInfo) {
        if (_.isNil(bulkMintInfo)) {
            throw Error('bulkMintInfo cannot be nil');
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

    async mintAndSubmit(bulkMintInfo) {
        const mint = await this.mint(bulkMintInfo);
        return await this.fulllNode.push_tx({
            spend_bundle: mint.spend_bundle,
        });
    }
}


async function findNftWalletId(wallet, did) {
    // get all NFT wallets
    const response = await wallet.get_wallets({
        type: 10, // NFT
        includ_data: true,
    });

    // if we have a did look for an nft wallet linked to it first
    if (!_.isNil(did)) {
        // see if any match the did (should either be one or none)
        const did_id = _utils.address_to_puzzle_hash(did);
        const matchingWallets = response.wallets.filter(wallet => {
            if (!_.isNil(wallet.data)) {
                const data = JSON.parse(wallet.data);
                return data.did_id === did_id;
            }
            return false;
        });

        // if we found a match return it
        if (matchingWallets.length > 0) {
            return matchingWallets[0].id;
        }
    }
    // otherwise return the first nft wallet
    if (response.wallets.length > 0) {
        return response.wallets[0].id;
    }

    // no nft wallets - eek
    throw new CriticalError('No NFT wallets.');
}
