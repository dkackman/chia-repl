import { randomBytes } from 'crypto-browserify';
import { WebSocket } from 'ws';
import { readFileSync } from 'fs';
import { homedir } from 'os';

class Chia {
    constructor(options) {
        this.options = options;
        this.outgoing = new Map(); // outgoing messages awaiting a response
        this.incoming = new Map(); // incoming responses 
    }

    get endpoints() {
        return {
            daemon: async (command, data) => this.sendCommand('daemon', command, data),
            full_node: async (command, data) => this.sendCommand('chia_full_node', command, data),
            wallet: async (command, data) => this.sendCommand('chia_wallet', command, data),
            farmer: async (command, data) => this.sendCommand('chia_farmer', command, data),
            harvester: async (command, data) => this.sendCommand('chia_harvester', command, data),
            crawler: async (command, data) => this.sendCommand('chia_crawler', command, data),
        }
    }

    connect(success, error) {
        if (this.ws !== undefined) {
            throw new Error('Already connected');
        }

        const wsOptions = {
            rejectUnauthorized: false,
            key: readFileSync(this.options.key_path.replace('~', homedir())),
            cert: readFileSync(this.options.cert_path.replace('~', homedir())),
        };
        const address = `wss://${this.options.host}:${this.options.port}`;
        const ws = new WebSocket(address, wsOptions);

        ws.on('open', () => {
            console.log(`Connecting to ${address}...`);
            const msg = formatMessage('daemon', 'register_service', { service: 'chia_repl' });
            ws.send(JSON.stringify(msg));
        });

        ws.on('message', (data) => {
            const msg = JSON.parse(data);

            if (this.outgoing.has(msg.request_id)) {
                this.outgoing.delete(msg.request_id);
                this.incoming.set(msg.request_id, msg);
            } else if (success !== undefined && msg.command === 'register_service') {
                success(); //a little bit hacky way to callback after register service finishes
            }
        });

        ws.on('error', (e) => {
            console.log(e);
            if (error !== undefined) {
                error();
            }
        });

        ws.on('close', () => {
            console.log('Disconnecting...');
            if (success !== undefined) {
                success();
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
            if (elapsed / 1000 > this.options.timeout_seconds) {
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

const _Chia = Chia;
export { _Chia as Chia };
