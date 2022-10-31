import _ from 'lodash';

export default class NftBulkMinter {
    constructor(wallet, fullNode, walletId, didCoin) {
        if (_.isNil(wallet)) {
            throw Error('wallet cannot be nil');
        }
        if (_.isNil(fullNode)) {
            throw Error('fullNode cannot be nil');
        }

        this.wallet = wallet;
        this.fullNode = fullNode;
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
        const status = await this.fullNode.push_tx({
            spend_bundle: mint.spend_bundle,
        });

        return {
            spend_bundle: mint.spend_bundle,
            status: status.status,
        };
    }

    async waitForCoin(launcher, pauseSeconds = 10, timeoutSeconds = 300) {
        const timer = ms => new Promise(res => setTimeout(res, ms));
        const start = Date.now();
        const timeoutMilliseconds = timeoutSeconds * 1000;
        const pauseMilliseconds = pauseSeconds * 1000;

        let coinExists = false;
        while (!coinExists) {
            await timer(pauseMilliseconds);

            try {
                const coinRecordResponse = await this.fullNode.get_coin_record_by_name({ name: launcher });
                coinExists = coinRecordResponse !== undefined;
            }
            catch (e) {
                // no coin yet - keep waiting
                console.debug(`waiting for coin ${launcher}`);
            }

            if (Date.now() - start > timeoutMilliseconds) {
                throw new Error(`waiting for coin ${launcher} timed out`);
            }
        }
    }
}
