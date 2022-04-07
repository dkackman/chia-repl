const repl = require('repl');
const chia = require("./chia");

const replServer = repl.start({ prompt: '> ', useColors: true });
replServer.context.options = {
  host: "localhost",
  port: 55400,
  key_path: '~/.chia/mainnet/config/ssl/daemon/private_daemon.key',
  cert_path: '~/.chia/mainnet/config/ssl/daemon/private_daemon.crt',
  timeout_seconds: 30,
};

replServer.on('exit', () => {
  if (replServer.context.chiaServer !== undefined) {
    replServer.context.chiaServer.disconnect();
    replServer.context.chiaServer = undefined;
  }
  process.exit();
});

replServer.defineCommand('connect', {
  help: 'Opens the websocket connection to the chia daemon. Enables these awaitable functions: crawler, daemon, farmer, full_node, harvester, wallet',
  action() {
    if (replServer.context.chiaServer !== undefined) {
      console.log("Already connected. Use .disconnect first");
      replServer.displayPrompt();
    }
    else {
      const chiaServer = new chia.Chia(replServer.context.options);
      chiaServer.connect(() => {
        console.log("done");
        replServer.displayPrompt();
      });
      replServer.context.chiaServer = chiaServer;
      replServer.context.daemon = async (command, data) => chiaServer.sendCommand("daemon", command, data);
      replServer.context.full_node = async (command, data) => chiaServer.sendCommand("chia_full_node", command, data);
      replServer.context.wallet = async (command, data) => chiaServer.sendCommand("chia_wallet", command, data);
      replServer.context.farmer = async (command, data) => chiaServer.sendCommand("chia_farmer", command, data);
      replServer.context.harvester = async (command, data) => chiaServer.sendCommand("chia_harvester", command, data);
      replServer.context.crawler = async (command, data) => chiaServer.sendCommand("chia_crawler", command, data);
    }
  }
});

replServer.defineCommand('disconnect', {
  help: 'Closes the websocket connection to the chia daemon.',
  action() {
    if (replServer.context.chiaServer !== undefined) {
      replServer.context.chiaServer.disconnect();
      replServer.context.chiaServer = undefined;
      // clear all these out so they aren't avaialbe in the repl when not connected
      replServer.context.daemon = undefined;
      replServer.context.full_node = undefined;
      replServer.context.wallet = undefined;
      replServer.context.farmer = undefined;
      replServer.context.harvester = undefined;
      replServer.context.crawler = undefined;
    } else {
      console.log("not connected");
      replServer.displayPrompt();
    }
  }
});
