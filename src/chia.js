const cb = require('crypto-browserify');
const wslib = require('ws');
const fs = require('fs');
const os = require("os");

'use strict';
class Chia {
  constructor(options) {
    this.options = options;
    this.outgoing = {}; // outgoing messages awaiting a response
    this.incoming = {}; // incoming messages 
  }

  connect(cb) {
    if (this.ws !== undefined) {
      throw new Error("Already connected");
    }
    const options = {
      rejectUnauthorized: false,
      key: fs.readFileSync(this.options.key_path.replace("~", os.homedir())),
      cert: fs.readFileSync(this.options.cert_path.replace("~", os.homedir())),
    };
    const host = `wss://${this.options.host}:${this.options.port}`;
    const ws = new wslib.WebSocket(host, options);
    ws.on('open', function open() {
      console.log(`Connecting to ${host}...`);
      const msg = formatMessage("daemon", "register_service", { service: "chia_repl" });
      ws.send(JSON.stringify(msg));
    });

    ws.on('message', (data) => {
      const msg = JSON.parse(data);

      if (this.outgoing[msg.request_id] !== undefined) {
        this.outgoing[msg.request_id] = undefined;
        this.incoming[msg.request_id] = msg;
      } else if (cb !== undefined && msg.command == "register_service") {
        cb(); //a little bit hacky way to do a callback on first connection
      }
    });

    ws.on('close', function message(data) {
      console.log("Disconnecting...");
      if (cb !== undefined) {
        cb();
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
    while (this.incoming[id] === undefined) {
      await timer(500);
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
    request_id: cb.randomBytes(32).toString('hex'),
    data: data,
  };
}

module.exports.Chia = Chia;
