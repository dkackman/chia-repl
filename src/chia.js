import { randomBytes } from 'crypto-browserify';
import { WebSocket } from 'ws';
import { readFileSync } from 'fs';
import { homedir } from "os";

'use strict';
class Chia {
  constructor(options) {
    this.options = options;
    this.outgoing = {}; // outgoing messages awaiting a response
    this.incoming = {}; // incoming responses 
  }

  connect(callback) {
    if (this.ws !== undefined) {
      throw new Error("Already connected");
    }

    const wsOptions = {
      rejectUnauthorized: false,
      key: readFileSync(this.options.key_path.replace("~", homedir())),
      cert: readFileSync(this.options.cert_path.replace("~", homedir())),
    };
    const address = `wss://${this.options.host}:${this.options.port}`;
    const ws = new WebSocket(address, wsOptions);

    ws.on('open', () => {
      console.log(`Connecting to ${address}...`);
      const msg = formatMessage("daemon", "register_service", { service: "chia_repl" });
      ws.send(JSON.stringify(msg));
    });

    ws.on('message', (data) => {
      const msg = JSON.parse(data);

      if (this.outgoing[msg.request_id] !== undefined) {
        this.outgoing[msg.request_id] = undefined;
        this.incoming[msg.request_id] = msg;
      } else if (callback !== undefined && msg.command == "register_service") {
        callback(); //a little bit hacky way to do a callback on first connection
      }
    });

    ws.on('error', (e) => {
      console.log(e);
    });

    ws.on('close', () => {
      console.log("Disconnecting...");
      if (callback !== undefined) {
        callback();
      }
    });

    this.ws = ws;
  }

  disconnect() {
    if (this.ws === undefined) {
      throw new Error("Not connected");
    }

    this.ws.close();
    this.ws = undefined;
  }

  async sendCommand(destination, command, data) {
    if (this.ws === undefined) {
      throw new Error("Not connected");
    }

    const outgoingMsg = formatMessage(destination, command, data);
    const id = outgoingMsg.request_id;
    this.outgoing[id] = outgoingMsg;

    this.ws.send(JSON.stringify(outgoingMsg));

    const timer = ms => new Promise(res => setTimeout(res, ms));
    const start = Date.now();
    while (this.incoming[id] === undefined) {
      await timer(100);
      const elapsed = Date.now() - start;
      if (elapsed / 1000 > this.options.timeout_seconds) {
        throw new Error("Timeout expired");
      }
    }

    const incomingMsg = this.incoming[id];
    this.incoming[id] = undefined;
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
    origin: "chia_repl",
    destination: destination,
    ack: false,
    request_id: randomBytes(32).toString('hex'),
    data: data,
  };
}

const _Chia = Chia;
export { _Chia as Chia };
