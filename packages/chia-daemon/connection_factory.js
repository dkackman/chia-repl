import { getChiaRoot } from "chia-root-resolver";
import Connection from "./connection.js";

export const ServiceNames = {
    Daemon: "daemon",
    FullNode: "full_node",
    Wallet: "wallet",
    Farmer: "farmer",
    Harvester: "harvester",
    Crawler: "crawler",
    DataLayer: "data_layer",
};

export const ServicePorts = {
    daemon: 55400,
    full_node: 8555,
    wallet: 9256,
    farmer: 8559,
    harvester: 8560,
    crawler: 8561,
    data_layer: 8562,
};

export function createConnection(serviceName, host, chiaRoot, timeoutSeconds) {
    if (chiaRoot === undefined) {
        chiaRoot = getChiaRoot();
    }

    return new Connection(
        serviceName,
        host,
        ServicePorts[serviceName],
        `${chiaRoot}/config/ssl/${serviceName}/private_${serviceName}.key`,
        `${chiaRoot}/config/ssl/${serviceName}/private_${serviceName}.crt`,
        timeoutSeconds ?? 30
    );
}
