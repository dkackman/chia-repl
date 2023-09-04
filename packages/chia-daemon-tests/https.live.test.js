import chai from "chai";
import { createHttpsService, createConnection } from "chia-daemon";
import _utils from "chia-utils";

const expect = chai.expect;

describe("chia-https", () => {
    describe("invocation", () => {
        it("should get all the way to the rpc endpoint", async function () {
            const connection = createConnection(
                "full_node",
                "localhost",
                "e:/chia/mainnet",
                60
            );
            this.timeout(connection.timeout_seconds * 1000);

            const full_node = createHttpsService(connection);

            const state = await full_node.get_blockchain_state();
            expect(state).to.not.equal(undefined);
            expect(state).to.not.equal(null);
        });
        it("should pass arguments _DEBUG_", async function () {
            const connection = createConnection(
                "wallet",
                "localhost",
                "e:/chia/mainnet",
                60
            );
            this.timeout(connection.timeout_seconds * 1000);

            const wallet = createHttpsService(connection);

            const response = await wallet.get_wallets({ include_data: true });
            expect(response).to.not.equal(undefined);
            expect(response.wallets[1].data).to.not.equal(undefined);
            expect(response.wallets[1].data.length).to.be.greaterThan(0);
        });
    });
});
