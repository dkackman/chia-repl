const wslib = require('ws');
const fs = require('fs');
const cb = require('crypto-browserify');
const repl = require('repl');
const os = require("os");

const options = {
  host: "localhost",
  port: 55400,
  key_path: '~/.chia/mainnet/config/ssl/daemon/private_daemon.key',
  cert_path: '~/.chia/mainnet/config/ssl/daemon/private_daemon.crt'
};

const replServer = repl.start({ prompt: '> ', useColors: true });
replServer.on('exit', () => {
  if (replServer.context.ws !== undefined) {
    replServer.context.ws.close();
    replServer.context.ws = undefined;
  }
  process.exit();
});

replServer.context.options = options;
replServer.defineCommand('connect', {
  help: 'Opens the websocket connection to the chia daemon',
  action() {
    if (replServer.context.ws !== undefined) {
      console.log("already connected. Use .disconnect first");
      return;
    }

    const options = {
      rejectUnauthorized: false,
      key: fs.readFileSync(replServer.context.options.key_path.replace("~", os.homedir())),
      cert: fs.readFileSync(replServer.context.options.cert_path.replace("~", os.homedir())),
    };
    const ws = new wslib.WebSocket(`wss://${replServer.context.options.host}:${replServer.context.options.port}`, options);
    replServer.context.ws = ws;

    ws.on('open', function open() {
      console.log("Connecting...");
      const msg = formatMessage("register_service", "daemon", { service: "chia_repl" });
      ws.send(msg);
    });

    ws.on('message', function message(data) {
      console.log(JSON.stringify(JSON.parse(data), null, 2));
      replServer.displayPrompt();
    });

    ws.on('close', function message(data) {
      console.log("Disconnected...");
      replServer.displayPrompt();
    });
  }
});

replServer.defineCommand('disconnect', {
  help: 'Closes the websocket connection to the chia daemon',
  action() {
    if (replServer.context.ws !== undefined) {
      replServer.context.ws.close();
      replServer.context.ws = undefined;
    } else {
      console.log("not connected");
    }
  }
});

replServer.defineCommand('daemon', {
  help: 'Sends a command to the chia daemon',
  action(command) {
    if (replServer.context.ws !== undefined) {
      const msg = formatMessage(command, "daemon");
      replServer.context.ws.send(msg);
    } else {
      console.log("not connected");
    }
  }
});

function formatMessage(command, destination, data = {}) {
  var message = {};
  message.command = command;
  message.origin = "chia_repl";
  message.destination = destination;
  message.ack = false;
  message.request_id = cb.randomBytes(32).toString('hex');
  message.data = data;

  return JSON.stringify(message);
}