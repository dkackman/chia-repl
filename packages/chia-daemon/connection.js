import { readFileSync } from "fs";
import untildify from "./untildify.js";

export default class Connection {
    constructor(service, host, port, key_path, cert_path, timeout_seconds) {
        this.service = service;
        this.host = host;
        this.host = host;
        this.port = port;
        this.key_path = key_path;
        this.cert_path = cert_path;
        this.timeout_seconds = timeout_seconds;
    }

    createClientOptions() {
        return {
            rejectUnauthorized: false,
            keepAlive: true,
            key: readFileSync(untildify(this.key_path)),
            cert: readFileSync(untildify(this.cert_path)),
        };
    }

    get daemonAddress() {
        return `wss://${this.host}:${this.port}`;
    }

    get serviceAddress() {
        return `https://${this.host}:${this.port}`;
    }
}
