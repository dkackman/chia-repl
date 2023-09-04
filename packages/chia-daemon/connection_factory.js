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

/**
 * The default ports for the services. (https://docs.chia.net/rpc)
 */
export const DefaultServicePorts = {
    daemon: 55400,
    full_node: 8555,
    wallet: 9256,
    farmer: 8559,
    harvester: 8560,
    crawler: 8561,
    data_layer: 8562,
};

/**
 * Creates a connection to a service.
 * @param {string} serviceName - The service for the command. One of the ServiceNames constants.
 * @param {string} host - The host (ip or hostname) of the chia service.
 * @param {string} root - The path to the chia root directory. (can also be a path to the ssl directory)
 * @param {int} timeoutSeconds - The timeout in seconds for the connection.
 * @param {object} portMap - The port map for the services. Defaults to DefaultServicePorts.
 * @returns {Connection} The connection object
 */
export function createConnection(
    serviceName,
    host,
    root,
    timeoutSeconds = 30,
    portMap = DefaultServicePorts
) {
    // if the user didn't specify a root, try to find it
    if (root === undefined) {
        root = getChiaRoot();
    }

    // if the root isn't an ssl path, assume it's the
    // chia root and append the ssl path
    if (!root.endsWith("/config/ssl")) {
        root = `${root}/config/ssl`;
    }

    return new Connection(
        serviceName,
        host,
        portMap[serviceName],
        `${root}/${serviceName}/private_${serviceName}.key`,
        `${root}/${serviceName}/private_${serviceName}.crt`,
        timeoutSeconds
    );
}
