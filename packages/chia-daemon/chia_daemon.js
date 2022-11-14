import { randomBytes } from 'crypto';
import { WebSocket } from 'ws';
import { readFileSync } from 'fs';
import createRpcProxy from './rpc_proxy.js';
import { EventEmitter } from 'events';
import untildify from './untildify.js';
import _ from 'lodash';

/** This can be found in the config but here for convenience. */
export let localDaemonConnection = {
    host: 'localhost',
    port: 55400,
    key_path: '~/.chia/mainnet/config/ssl/daemon/private_daemon.key',
    cert_path: '~/.chia/mainnet/config/ssl/daemon/private_daemon.crt',
    timeout_seconds: 30,
};

/**
 * This guy encapsulates asynchronous communication with the chia daemon
 * which in turn proxies communication to the other chia services.
 * @extends EventEmitter
 */
export default class ChiaDaemon extends EventEmitter {
    /**
     * Create a ChiaDaemon.
     * @param {Object} connection - Details of the connection.
     * @param {string} connection.host - The host name or IP address.
     * @param {number} connection.port - The daemon's listening port.
     * @param {string} connection.key_path - File path to the certificate key file used to secure the connection.
     * @param {string} connection.cert_path - File path to the certificate crt file used to secure the connection.
     * @param {number} connection.timeout_seconds - Timeout, in seconds, for each call to the deamon.
     * @param {string} service_name - the name of the client application or service talking to the daemon.
     */
    constructor(connection, service_name = 'my_chia_app') {
        super();
        if (connection === undefined) {
            throw new Error('Connection meta data must be provided');
        }

        this.connection = connection;
        this._service_name = service_name;
        this.outgoing = new Map(); // outgoing messages awaiting a response
        this.incoming = new Map(); // incoming responses not yet consumed
    }

    /** The service_name passed to the daemon as the message origin */
    get serviceName() {
        return this._service_name;
    }

    /**
     * Property indicating whether the chia daemon websocket is currently conneted
     */
    get connected() {
        return this.ws !== undefined;
    }

    /**
     * Property with each of the rpc services exposed by the chia node.
     * https://dkackman.github.io/chia-api/redoc/
     * @return {Object} An object with each of the service endpoints.
     */
    get services() {
        return {
            daemon: createRpcProxy(this, 'daemon'),
            full_node: createRpcProxy(this, 'chia_full_node'),
            wallet: createRpcProxy(this, 'chia_wallet'),
            farmer: createRpcProxy(this, 'chia_farmer'),
            harvester: createRpcProxy(this, 'chia_harvester'),
            crawler: createRpcProxy(this, 'chia_crawler'),
            simulator: createRpcProxy(this, 'chia_full_node_simulator'),
            data_layer: createRpcProxy(this, 'chia_data_layer'),
        };
    }

    /**
     * Opens the websocket connection and calls register_service on the daemon
     * @fires ChiaDaemon#connecting
     * @fires ChiaDaemon#connected
     * @fires ChiaDaemon#event-message
     * @fires ChiaDaemon#socket-error
     * @fires ChiaDaemon#disconnected
     * @returns {boolean} True if the socket is opened and service registered successfully. Otherwise false.
     */
    async connect() {
        if (this.connected) {
            throw new Error('Already connected');
        }

        const address = `wss://${this.connection.host}:${this.connection.port}`;
        this.emit('connecting', address);

        // the lifetime of the websocket is between connect and disconnect
        const ws = new WebSocket(address, {
            rejectUnauthorized: false,
            key: readFileSync(untildify(this.connection.key_path)),
            cert: readFileSync(untildify(this.connection.cert_path)),
        });

        ws.once('open', () => {
            const msg = formatMessage('daemon', 'register_service', this._service_name, { service: this._service_name });
            ws.send(JSON.stringify(msg));
        });

        ws.once('close', () => {
            this.emit('disconnected');
        });

        ws.on('message', (data) => {
            const msg = JSON.parse(data);

            if (this.outgoing.has(msg.request_id)) {
                this.outgoing.delete(msg.request_id);
                this.incoming.set(msg.request_id, msg);
            } else if (msg.command === 'register_service') {
                this.ws = ws;
                this.emit('connected');// we consider ourselves connected only after register_service succeeds
            } else {
                // received a socket message that was not a response to something we sent
                this.emit('event-message', msg);
            }
        });

        let error = false;
        ws.on('error', (e) => {
            error = true;
            this.emit('socket-error', e);
        });

        const timeout_milliseconds = this.connection.timeout_seconds * 1000;
        const timer = ms => new Promise(res => setTimeout(res, ms));
        const start = Date.now();

        // wait here until connected goes to true, there is an error or we timeout
        while (this.ws === undefined && !error) {
            await timer(100);
            if (Date.now() - start > timeout_milliseconds) {
                this.emit('socket-error', new Error('Connection timeout expired'));
                break;
            }
        }

        return this.connected;
    }

    /** Closes the websocket and clears all state */
    disconnect() {
        if (!this.connected) {
            throw new Error('Not connected');
        }

        this.ws.close();
        this.ws.removeAllListeners('message');
        this.ws.removeAllListeners('error');
        this.ws = undefined;

        this.incoming.clear();
        this.outgoing.clear();
    }

    /**
     * Sends a command to the daemon. For the most part not needed in favor of the 'ChiaDaemon.services' endpoints.
     * @param {string} destination - The destination service for the command. One of the known services like wallet or full_node
     * @param {string} command - The command to send, i.e. the rpc endpoint such as get_blockchain_state.
     * @param {Object} data - Any input arguments for the command. Omit if no rpc arguments are needed.
     * @returns {*} Any response payload from the endpoint.
     */
    async sendCommand(destination, command, data = {}) {
        if (!this.connected) {
            throw new Error('Not connected');
        }

        const outgoingMsg = formatMessage(destination, command, this._service_name, data);

        this.outgoing.set(outgoingMsg.request_id, outgoingMsg);
        this.ws.send(JSON.stringify(outgoingMsg));

        const timer = ms => new Promise(res => setTimeout(res, ms));
        const start = Date.now();
        const timeoutMilliseconds = this.connection.timeout_seconds * 1000;

        // wait here until an incoming response shows up
        while (this.ws !== undefined && !this.incoming.has(outgoingMsg.request_id)) {
            await timer(100);
            const elapsed = Date.now() - start;
            if (elapsed > timeoutMilliseconds) {
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
        if (!_.isNil(incomingMsg)) {
            this.incoming.delete(outgoingMsg.request_id);
            const incomingData = incomingMsg.data;
            if (incomingData.success === false) {
                throw new Error(incomingData.error);
            }

            return incomingData;
        }

        return undefined; // we can get here if we disconnect while waiting for a message still
    }
}

function formatMessage(destination, command, origin, data = {}) {
    return {
        command: command,
        origin: origin,
        destination: destination,
        ack: false,
        request_id: randomBytes(32).toString('hex'),
        data: data,
    };
}

/**
 * connecting event. Fires just before the WebSocket is created
 *
 * @event ChiaDaemon#connecting
 * @property {string} address - the full address of the daemon websocket wss://host:port
 * @type {object}
 */

/**
 * connected event. Fires after the socket is opened and register_service returns
 *
 * @event ChiaDaemon#connected
 * @type {object}
 */

/**
 * event-message event. Fires when the daemon sends an event.
 *
 * @event ChiaDaemon#event-message
 * @property {object} msg - The event message object.
 * @type {object}
 */

/**
 * socket-error event. Fires when the WebSocket reaises an error event.
 *
 * @event ChiaDaemon#socket-error
 * @property {Error} e - The Error object rasied from the WebSocket.
 */

/**
 * disconnected event. Fires after the WebSocket is closed.
 *
 * @event ChiaDaemon#disconnected
 * @type {object}
 */
