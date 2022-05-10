import { randomBytes } from 'crypto';
import { WebSocket } from 'ws';
import { readFileSync } from 'fs';
import { homedir } from 'os';
import { createRpcProxy } from './rpc_proxy.js';

export let defaultConnection = {
    host: 'localhost',
    port: 55400,
    key_path: '~/.chia/mainnet/config/ssl/daemon/private_daemon.key',
    cert_path: '~/.chia/mainnet/config/ssl/daemon/private_daemon.crt',
    timeout_seconds: 30,
    prefix: 'xch',
};

class ChiaDaemon {
    constructor(connection) {
        this.connection = connection;
        this.outgoing = new Map(); // outgoing messages awaiting a response
        this.incoming = new Map(); // incoming responses 
    }

    get endpoints() {
        return {
            daemon: createRpcProxy(this, 'daemon'),
            full_node: createRpcProxy(this, 'chia_full_node'),
            wallet: createRpcProxy(this, 'chia_wallet'),
            farmer: createRpcProxy(this, 'chia_farmer'),
            harvester: createRpcProxy(this, 'chia_harvester'),
            crawler: createRpcProxy(this, 'chia_crawler'),
        };
    }

    connect(status, error) {
        if (this.ws !== undefined) {
            throw new Error('Already connected');
        }

        const address = `wss://${this.connection.host}:${this.connection.port}`;
        const ws = new WebSocket(address, {
            rejectUnauthorized: false,
            key: readFileSync(this.connection.key_path.replace('~', homedir())),
            cert: readFileSync(this.connection.cert_path.replace('~', homedir())),
        });

        ws.on('open', () => {
            const msg = formatMessage('daemon', 'register_service', { service: 'chia_repl' });
            ws.send(JSON.stringify(msg));
        });

        ws.on('message', (data) => {
            const msg = JSON.parse(data);

            if (this.outgoing.has(msg.request_id)) {
                this.outgoing.delete(msg.request_id);
                this.incoming.set(msg.request_id, msg);
            } else if (status !== undefined && msg.command === 'register_service') {
                status('Connected'); //a little bit hacky way to callback after register service finishes
            }
        });

        ws.on('error', (e) => {
            if (error !== undefined) {
                error(e);
            }
        });

        ws.on('close', () => {
            if (status !== undefined) {
                status('Disconnected');
            }
        });

        this.ws = ws;
    }

    disconnect() {
        if (this.ws === undefined) {
            throw new Error('Not connected');
        }

        this.ws.close();
        this.ws = undefined;
        this.incoming.clear();
        this.outgoing.clear();
    }

    async sendCommand(destination, command, data) {
        if (this.ws === undefined) {
            throw new Error('Not connected');
        }

        const outgoingMsg = formatMessage(destination, command, data);

        this.outgoing.set(outgoingMsg.request_id, outgoingMsg);
        this.ws.send(JSON.stringify(outgoingMsg));

        const timer = ms => new Promise(res => setTimeout(res, ms));
        const start = Date.now();

        // wait here until an incoming response shows up
        while (!this.incoming.has(outgoingMsg.request_id)) {
            await timer(100);
            const elapsed = Date.now() - start;
            if (elapsed / 1000 > this.connection.timeout_seconds) {
                //clean up anything lingering for this message
                if (this.outgoing.has(outgoingMsg.request_id)) {
                    this.outgoing.delete(outgoingMsg.request_id);
                }
                if (this.incoming.has(outgoingMsg.request_id)) {
                    this.incoming.delete(outgoingMsg.request_id);
                }
                throw new Error('Timeout expired');
            }
        }

        const incomingMsg = this.incoming.get(outgoingMsg.request_id);
        this.incoming.delete(outgoingMsg.request_id);
        const incomingData = incomingMsg.data;
        if (incomingData.success === false) {
            throw new Error(incomingData.error);
        }
        return incomingData;
    }
}

function formatMessage(destination, command, data = {}) {
    return {
        command: command,
        origin: 'chia_repl',
        destination: destination,
        ack: false,
        request_id: randomBytes(32).toString('hex'),
        data: data,
    };
}

const _Chia = ChiaDaemon;
export { _Chia as ChiaDaemon };
