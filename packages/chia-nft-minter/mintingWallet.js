import _utils from 'chia-utils';
import _ from 'lodash';

// this looks up the appropriate wallet and/or did info so it can be cached for later use
// if did is undefined just returns the first NFT wallet
// if did is supplied find the first nft wallet that references the did
//   and also find the coin assocaited with the did
export default async function getMintingWallet(wallet, fulllNode, did) {
    if (_.isNil(wallet)) {
        throw Error('wallet cannot be nil');
    }
    if (_.isNil(fulllNode)) {
        throw Error('fulllNode cannot be nil');
    }

    // get all the NFT wallets
    const response = await wallet.get_wallets({
        type: 10, // NFT
        includ_data: true,
    });

    if (!_.isNil(did)) {
        // see if any match the did (should either be one or none)
        const did_id = _utils.address_to_puzzle_hash(did);
        const nftWalletsWithDid = response.wallets.filter(wallet => {
            if (!_.isNil(wallet.data)) {
                const data = JSON.parse(wallet.data);
                return _.get(data, 'did_id') === did_id;
            }
            return false;
        });

        // if we an nft wallet that references the did
        if (nftWalletsWithDid.length > 0) {
            // look up the coin associated with the did wallet
            const did_coin = await getDidWalletCoin(wallet, fulllNode, did);

            return {
                wallet_id: response.wallets[0].id,
                is_did: true,
                did_coin,
            };
        }
    }

    // otherwise return the first nft wallet
    if (response.wallets.length > 0) {
        return {
            wallet_id: response.wallets[0].id,
            is_did: false,
        };
    }

    // no nft wallets - eek
    throw new Error('No NFT wallets.');
}

async function getDidWalletCoin(wallet, fulllNode, did) {
    // get all did wallets
    const response = await wallet.get_wallets({
        type: 8, // DISTRIBUTED_ID
    });
    const didWallets = response.wallets.filter(wallet => wallet.name === `DID ${did}` || wallet.name == did);

    if (didWallets.length > 0) {
        // get the did object associated with the wallet and lookup its coin record
        const didObject = await wallet.did_get_did({ wallet_id: didWallets[0].id });
        const recordLookup = await fulllNode.get_coin_record_by_name({ name: didObject.coin_id });

        return recordLookup.coin_record.coin;
    }

    return undefined;
}
