const cb = require('crypto-browserify');
const wslib = require('ws');
const fs = require('fs');
const os = require("os");

'use strict';
class Chia {
  constructor(options) {
    this.options = options;
    this.outgoing = {};
    this.incoming = {};
  }

  // await chia.daemon("is_running", { service: "farmer" })
  connect() {
    if (this.ws !== undefined) {
      throw new Error("Already connected");
    }
    const options = {
      rejectUnauthorized: false,
      key: fs.readFileSync(this.options.key_path.replace("~", os.homedir())),
      cert: fs.readFileSync(this.options.cert_path.replace("~", os.homedir())),
    };
    const ws = new wslib.WebSocket(`wss://${this.options.host}:${this.options.port}`, options);
    ws.on('open', function open() {
      console.log("Connecting...");
      const msg = formatMessage("daemon", "register_service", { service: "chia_repl" });
      ws.send(JSON.stringify(msg));
    });

    ws.on('message', (data) => {
      const msg = JSON.parse(data);
      if (this.outgoing[msg.request_id] !== undefined) {
        this.outgoing[msg.request_id] = undefined;
        this.incoming[msg.request_id] = msg;
      }
    });

    ws.on('close', function message(data) {
      console.log("Disconnected...");
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
  var message = {};
  message.command = command;
  message.origin = "chia_repl";
  message.destination = destination;
  message.ack = false;
  message.request_id = cb.randomBytes(32).toString('hex');
  message.data = data;

  return message;
}

module.exports.Chia = Chia;
