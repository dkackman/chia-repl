import { readFileSync } from "fs";
import untildify from "./untildify.js";

export default class Connection {
    constructor(host, port, key_path, cert_path, timeout_seconds) {
        this.host = host;
        this.port = port;
        this.key_path = key_path;
        this.cert_path = cert_path;
        this.timeout_seconds = timeout_seconds;
    }

    createClientOptions() {
        return {
            rejectUnauthorized: false,
            key: readFileSync(untildify(this.key_path)),
            cert: readFileSync(untildify(this.cert_path)),
        };
    }

    get wssAddress() {
        return `wss://${this.host}:${this.port}`;
    }
}
