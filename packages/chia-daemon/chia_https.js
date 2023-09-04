import _ from "lodash";
import Connection from "./connection.js";
import { EventEmitter } from "events";

export default class ChiaHttps extends EventEmitter {
    constructor(connection) {
        super();
        if (connection === undefined) {
            throw new Error("Connection meta data must be provided");
        }

        this.connection = new Connection(
            connection.service,
            connection.host,
            connection.port,
            connection.key_path,
            connection.cert_path,
            connection.timeout_seconds
        );
    }

    get chiaServiceName() {
        return this.connection.service;
    }

    async sendCommand(destination, command, data = {}) {
        if (destination !== this.connection.service) {
            // if this happens something is seriously wrong
            throw new Error(
                `Invalid destination ${destination} for service ${this.connection.service}`
            );
        }
    }
}
