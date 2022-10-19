// here just in case i ever need to remember as im not 100% certain
// in the way nft_mint_bulk handles fees

/*
if (bulk_info.fee > 0) { // this is what the bulk minting tool does - not sure it's needed
    const spend_bundles = [mint.spend_bundle];
    const total_fee_to_pay = spend_bundles.length * bulk_info.fee;
    // we need at least a 1 mojo coin to fund the mint operation
    const coins = await chia.services.wallet.select_coins({
        wallet_id: 1, // this is alwasy an xch wallet
        amount: bulk_info.mint_total * bulk_info.fee
    });

    bulk_info.xch_coin_list = coins.coins;
    const fee_coins = await chia.services.wallet.select_coins({
        amount: total_fee_to_pay,
        wallet_id: 1,
        excluded_coins: bulk_info.xch_coin_list,
    });
    const fee_coin = fee_coins.coins[0];
    const fee_tx = await chia.services.wallet.create_signed_transaction({
        additions: [
            {
                amount: fee_coin.amount - bulk_info.fee,
                puzzle_hash: fee_coin.puzzle_hash,
            }
        ],
        coins: [fee_coin],
        fee: bulk_info.fee,
    });
    spend_bundles.push(fee_tx.signed_tx.spend_bundle);
    const aggregate = true;
    if (aggregate) {
        const final_sb = await chia.services.wallet.aggregate_spend_bundles({
            spend_bundles
        });
        const spend = await chia.services.full_node.push_tx({
            spend_bundle: final_sb.spend_bundle,
        });
        expect(spend.status).to.equal('SUCCESS');
    } else {
        //const coins = [];
        const additions = [];
        for (let i = 0; i < spend_bundles.length; i++) {
            const sb = spend_bundles[i];
            if (!_.isNil(sb.coin_solutions)) {
                sb.coin_solutions.forEach(solution => {
                    additions.push({
                        amount: solution.coin.amount,
                        puzzle_hash: solution.coin.puzzle_hash,
                    });
                });
            }
            if (!_.isNil(sb.coin_spends)) {
                sb.coin_spends.forEach(spend => {
                    additions.push({
                        amount: spend.coin.amount,
                        puzzle_hash: spend.coin.puzzle_hash,
                    });
                });
            }
        }
        const payload = {
            wallet_id: 1,
            fee: bulk_info.fee,
            //coins,
            additions,
        };
        const spend = await chia.services.wallet.send_transaction_multi(payload);
        expect(_.isNil(spend)).to.equal(false);
    }
} else {
    const spend = await chia.services.full_node.push_tx({
        spend_bundle: mint.spend_bundle,
    });
    expect(_.isNil(spend)).to.equal(false);
    expect(spend.status).to.equal('SUCCESS');
}
*/
