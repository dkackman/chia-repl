import chai from 'chai';
import { ChiaDaemon } from 'chia-daemon';
import _ from 'lodash';
import _utils from 'chia-utils';

const expect = chai.expect;

// some tests assume that a daemon is reachable with these details
const valid_connection = {
    host: 'chiapas',
    port: 55400,
    key_path: '~/.chia/mainnet - chiapas/config/ssl/daemon/private_daemon.key',
    cert_path: '~/.chia/mainnet - chiapas/config/ssl/daemon/private_daemon.crt',
    timeout_seconds: 10,
};

async function getFirstSpentParentRecord(full_node, coin) {
    const getCoinRecordResponse = await full_node.get_coin_record_by_name({ name: coin.parent_coin_info });
    const parentCoinRecord = getCoinRecordResponse.coin_record;
    if (parentCoinRecord.spent === true) {
        return parentCoinRecord;
    }

    return await getFirstSpentParentRecord(full_node, parentCoinRecord.coin);
}

describe('chia-daemon', () => {
    describe('scratch', () => {
        it('should find a coins spent parent', async function(){
            this.timeout(300 * 1000);
            const chia = new ChiaDaemon(valid_connection, 'tests');
            const connected = await chia.connect();
            expect(connected).to.equal(true);

            const getCoinsResponse = await chia.services.full_node.get_coin_records_by_puzzle_hash({
                puzzle_hash: _utils.address_to_puzzle_hash('txch1h496dp9fmyh392ng0t7myal3qxy56r4jre8uzt48guqmkdepldpq763zkh'),
                include_spent_coins: false
            });
            const records = _.get(getCoinsResponse, 'coin_records', []);
            for (let i = 0; i < records.length; i++) {
                const coinRecord = records[i];
                const coin = coinRecord.coin;

                const spentParentRecord = await getFirstSpentParentRecord(chia.services.full_node, coin);
                expect(spentParentRecord.spent).to.equal(true);
            }
        });
        it('should find a coins spent parent', async function(){
            this.timeout(300 * 1000);
            const chia = new ChiaDaemon(valid_connection, 'tests');
            const connected = await chia.connect();
            expect(connected).to.equal(true);

            const getCoinsResponse = await chia.services.full_node.get_coin_records_by_puzzle_hash({
                puzzle_hash: _utils.address_to_puzzle_hash('txch1h496dp9fmyh392ng0t7myal3qxy56r4jre8uzt48guqmkdepldpq763zkh'),
                include_spent_coins: false
            });
            const records = _.get(getCoinsResponse, 'coin_records', []);
            for (let i = 0; i < records.length; i++) {
                const coinRecord = records[i];
                const coin = coinRecord.coin;

                const spentParentRecord = await getFirstSpentParentRecord(chia.services.full_node, coin);

                const parent_coin = spentParentRecord.coin;
                const parentCoinId = _utils.get_coin_info_mojo(parent_coin.parent_coin_info, parent_coin.puzzle_hash, parent_coin.amount);

                const spendResposne = await chia.services.full_node.get_puzzle_and_solution({
                    coin_id: parentCoinId,
                    height: spentParentRecord.spent_block_index,
                });
                console.log(spendResposne);
            }
        });
    });
});
