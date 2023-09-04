export const ServiceNames = {
    FullNode: "full_node",
    Wallet: "wallet",
    Farmer: "farmer",
    Harvester: "harvester",
    Simulator: "full_node_simulator",
    Plotter: "plotter",
    Crawler: "crawler",
    DataLayer: "data_layer",
};

export default class ChiaHttps {
    constructor(connection, chiaServiceName) {
        super();
        if (connection === undefined) {
            throw new Error("Connection meta data must be provided");
        }

        this.connection = connection;
        this._chiaServiceName = chiaServiceName;
    }

    get chiaServiceName() {
        return this._chiaServiceName;
    }

    async sendCommand(destination, command, data = {}) {}
}
