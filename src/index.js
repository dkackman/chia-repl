const repl = require('repl');
const chia = require("./chia");

const replServer = repl.start({ prompt: '> ', useColors: true });
replServer.context.options = {
  host: "chiapas",
  port: 55400,
  key_path: '~/.chia/mainnet/config/ssl/daemon/private_daemon.key',
  cert_path: '~/.chia/mainnet/config/ssl/daemon/private_daemon.crt'
};

replServer.on('exit', () => {
  if (replServer.context.chiaServer !== undefined) {
    replServer.context.chiaServer.disconnect();
    replServer.context.chiaServer = undefined;
  }
  process.exit();
});

replServer.defineCommand('connect', {
  help: 'Opens the websocket connection to the chia daemon',
  action() {
    if (replServer.context.chiaServer !== undefined) {
      console.log("Already connected. Use .disconnect first");
    }
    else {
      const chiaServer = new chia.Chia(replServer.context.options);
      chiaServer.connect();
      replServer.context.chiaServer = chiaServer;
      replServer.context.daemon = async (command, data) => chiaServer.sendCommand("daemon", command, data);
    }
    replServer.displayPrompt();
  }
});

replServer.defineCommand('disconnect', {
  help: 'Closes the websocket connection to the chia daemon',
  action() {
    if (replServer.context.chiaServer !== undefined) {
      replServer.context.chiaServer.disconnect();
      replServer.context.chiaServer = undefined;
      replServer.context.daemon = undefined;
    } else {
      console.log("not connected");
    }
    replServer.displayPrompt();
  }
});
