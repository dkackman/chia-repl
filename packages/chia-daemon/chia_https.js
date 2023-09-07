import _ from "lodash";
import { ChiaConnection } from "chia-service-connector";
import axios from "axios";
import https from "https";
import createRpcProxy from "./rpc_proxy.js";

export function createHttpsService(connection) {
    if (connection === undefined) {
        throw new Error("Connection meta data must be provided");
    }

    return createRpcProxy(new ChiaHttps(connection), connection.service);
}

/**
 * A class that encapsulates the details of connecting
 * to a chia service via https instead of wss
 * @param {object|ChiaConnection} connection - The connection details
 */
export class ChiaHttps {
    constructor(connection) {
        if (connection === undefined) {
            throw new Error("Connection meta data must be provided");
        }

        // just in case the user didn't pass in a Connection object
        this.connection = new ChiaConnection(
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

        // lazily create an axios instance
        if (this.axios === undefined) {
            this.axios = axios.create({
                baseURL: this.connection.serviceAddress,
                timeout: this.connection.timeout_seconds * 1000,
                headers: {
                    accepts: "application/json",
                    "content-type": "application/json",
                },
                httpsAgent: new https.Agent(
                    this.connection.createClientOptions()
                ),
            });
        }

        const response = await this.axios.post(`/${command}`, data);
        if (!response.data.success) {
            throw new Error(response.data.error);
        }
        return response.data;
    }
}
