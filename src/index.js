#! /usr/bin/env node
import { Chia } from './chia.js';
import { createRepl } from './repl_factory.js';
import * as context_manager from './context_manager.js';
import * as settings from './settings.js';
import * as _options from './options.js';
import chalk from 'chalk';

// poor man's interface until i get a better abstraction of the connection
const connection_manager = {
    connect: () => {
        const address = `wss://${replServer.context.connection.host}:${replServer.context.connection.port}`;
        console.log(`Connecting to ${address}...`);
        const chiaServer = new Chia(replServer.context.connection);
        chiaServer.connect((msg) => {
            console.log(msg);
            replServer.displayPrompt();
        },
        (e) => {
            context_manager.clearContext(replServer);
            console.log(e);
            replServer.displayPrompt();
        });
        replServer.context.chiaServer = chiaServer;
        replServer.context.chia = chiaServer.endpoints;
    },
    disconnect: () => {
        if (replServer.context.chiaServer !== undefined) {
            replServer.context.chiaServer.disconnect();
            context_manager.clearContext(replServer);
        }
    }
};

const options = settings.getSetting('.options', _options.defaultOptions);
const replServer = createRepl(options, connection_manager);

console.log(chalk.green('Welcome to Chia!'));
if (options.verbosity !== 'quiet') {
    console.log(chalk.gray('Type .help or .more-help to get started'));
}

if (options.autoConnect) {
    connection_manager.connect();
}
else {
    replServer.displayPrompt();
}
