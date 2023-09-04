import chai from "chai";
import { ChiaHttps, createConnection } from "chia-daemon";
import _utils from "chia-utils";

const expect = chai.expect;

describe("chia-https", () => {
    describe("invocation", () => {
        it("should get all the way to the rpc endpoint", async function () {
            this.timeout(valid_connection.timeout_seconds * 1000);
            const connection = createConnection(
                "full_node",
                "localhost",
                "e:/chia/mainnet",
                60
            );
            const full_node = new ChiaHttps(connection, "full_node");

            const state = await full_node.get_blockchain_state();
            expect(state).to.not.equal(undefined);
            expect(state).to.not.equal(null);

            chia.disconnect();
        });
    });
});
