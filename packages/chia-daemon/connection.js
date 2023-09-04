import { readFileSync } from "fs";
import untildify from "./untildify.js";

/**
 * Encapsulates the specific details needed to connect to a chia service.
 */
export default class Connection {
    /**
     *
     * @param {string} service - The service name - see ServiceNames
     * @param {string} host - The host (ip or hostname) of the chia service.
     * @param {number} port - The port of the chia service.
     * @param {string} key_path - The path to the key file for the service (can have ~).
     * @param {string} cert_path - The path to the cert file for the service (can have ~).
     * @param {number} timeout_seconds - The timeout in seconds for the connection.
     */
    constructor(service, host, port, key_path, cert_path, timeout_seconds) {
        this.service = service;
        this.host = host;
        this.port = port;
        this.key_path = key_path;
        this.cert_path = cert_path;
        this.timeout_seconds = timeout_seconds;
    }

    /**
     * @returns {object} The options for the WebSocket
     * or Https connection. This includes reading the
     * cert and key files from disk
     */
    createClientOptions() {
        return {
            rejectUnauthorized: false,
            keepAlive: true,
            key: readFileSync(untildify(this.key_path)),
            cert: readFileSync(untildify(this.cert_path)),
        };
    }

    /** formatted address */
    get serviceAddress() {
        if (this.service === "daemon") {
            return `wss://${this.host}:${this.port}`;
        }
        return `https://${this.host}:${this.port}`;
    }
}
