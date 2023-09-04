import chai from "chai";
import { createHttpsService, createConnection } from "chia-daemon";
import _utils from "chia-utils";

const expect = chai.expect;

describe("chia-https", () => {
    describe("invocation", () => {
        it("should get all the way to the rpc endpoint _DEBUG_", async function () {
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
    });
});
