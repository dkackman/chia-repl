import chai from "chai";
import { ChiaDaemon, createConnection } from "chia-daemon";
import _utils from "chia-utils";

const expect = chai.expect;

// some tests assume that a daemon is reachable with these details
const valid_connection = createConnection(
    "daemon",
    "localhost",
    "e:/chia/mainnet",
    60
);

describe("chia-daemon", () => {
    describe("connection", () => {
        it("should raise socket-error event on invalid connection", async () => {
            const bad_connection = {
                host: "localhost",
                port: 44444,
                key_path:
                    "~/.chia/mainnet/config/ssl/daemon/private_daemon.key",
                cert_path:
                    "~/.chia/mainnet/config/ssl/daemon/private_daemon.crt",
                timeout_seconds: 5,
            };
            let error = false;

            const chia = new ChiaDaemon(bad_connection, "tests");
            chia.on("socket-error", (e) => {
                error = true;
            });
            const connected = await chia.connect();

            expect(error).to.equal(true);
            expect(connected).to.equal(false);
        });
        it("should return true on valid connection _DEBUG_", async function () {
            const chia = new ChiaDaemon(valid_connection, "tests");
            let error = false;
            chia.on("socket-error", (e) => {
                console.log(e);
                error = true;
            });
            const connected = await chia.connect();
            chia.disconnect();

            expect(error).to.equal(false);
            expect(connected).to.equal(true);
        });
    });
    describe("invocation", () => {
        it("should get all the way to the rpc endpoint", async function () {
            this.timeout(valid_connection.timeout_seconds * 1000);

            const chia = new ChiaDaemon(valid_connection, "tests");

            const connected = await chia.connect();
            expect(connected).to.equal(true);

            const state = await chia.services.full_node.get_blockchain_state();
            expect(state).to.not.equal(undefined);
            expect(state).to.not.equal(null);

            chia.disconnect();
        });
        it("should decode notification message", async function () {
            this.timeout(valid_connection.timeout_seconds * 10000);
            const chia = new ChiaDaemon(valid_connection, "tests");

            const connected = await chia.connect();
            expect(connected).to.equal(true);

            const notifications = await chia.services.wallet.get_notifications({
                start: 0,
                end: 1,
            });
            expect(notifications).to.not.equal(undefined);
            expect(notifications.notifications).to.not.equal(undefined);
            expect(notifications.notifications.length).to.equal(1);

            const n = notifications.notifications[0];

            const text = Buffer.from(n.message, "hex").toString("utf8");
            expect(text).to.equal("hello");

            const coinResponse =
                await chia.services.full_node.get_coin_record_by_name({
                    name: n.id,
                });
            const parentCoinRecord = await getFirstSpentParentRecord(
                chia.services.full_node,
                coinResponse.coin_record.coin
            );

            const address = _utils.puzzle_hash_to_address(
                parentCoinRecord.coin.puzzle_hash,
                "txch"
            );

            chia.disconnect();
        });
    });
    describe("listen", () => {
        it("should capture an event", async function () {
            // this test requires the node under test to be plotting or otherwise
            // be triggered to emit an event
            const timeout_milliseconds = 100000;
            this.timeout(timeout_milliseconds + 500);
            const chia = new ChiaDaemon(valid_connection, "wallet_ui");

            const connected = await chia.connect();
            expect(connected).to.equal(true);

            let event_received = false;
            chia.on("event-message", (m) => (event_received = true));

            const timer = (ms) => new Promise((res) => setTimeout(res, ms));
            const start = Date.now();

            ///stay here until we receive an event or timeout
            while (!event_received) {
                await timer(100);
                const elapsed = Date.now() - start;
                if (elapsed > timeout_milliseconds) {
                    break;
                }
            }
            chia.disconnect();

            expect(event_received).to.equal(true);
        });
    });
});

async function getFirstSpentParentRecord(full_node, coin) {
    const getCoinRecordResponse = await full_node.get_coin_record_by_name({
        name: coin.parent_coin_info,
    });
    const parentCoinRecord = getCoinRecordResponse.coin_record;
    if (parentCoinRecord.spent === true) {
        return parentCoinRecord;
    }

    return await getFirstSpentParentRecord(full_node, parentCoinRecord.coin);
}
