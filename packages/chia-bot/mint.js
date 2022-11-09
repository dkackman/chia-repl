import { NftMinter, getMintingWallet } from 'chia-nft-minter';

export default async function mint(wallet, fullNode, config, task, ipfs) {
    const minter = new NftMinter(wallet, config.nft_storage_key);
    const mintingWallet = await getMintingWallet(wallet, fullNode, config.creator_did);
    console.debug(`minting with wallet ${mintingWallet.wallet_id}`);

    const mingtingInfo = {
        wallet_id: mintingWallet.wallet_id,
        //target_address: task.target_address,
        royalty_address: task.royalty_address,
        royalty_percentage: task.royalty_percentage,
        fee: config.minting_fee,
        edition_number: 1,
        edition_total: 1,
        did_id: config.creator_did,
    };

    const mint = await minter.createNftFromIpfs(mingtingInfo, ipfs);
    const launcher = mint.spend_bundle.coin_solutions[0].coin.parent_coin_info;
    let coinExists = false;
    const timer = ms => new Promise(res => setTimeout(res, ms));
    while (!coinExists) {
        await timer(10000);

        try {
            const coin = await fullNode.get_coin_record_by_name({ name: launcher });
            coinExists = coin !== undefined;
        }
        catch (e) {
            console.log(`waiting for mint transaction ${launcher}`);
        }
    }

    return launcher;
}
