import { start } from 'repl';
import { Chia } from './chia.js';
import { getSetting, saveSetting, defaultOptions } from './settings.js';
import * as clvm_tools from 'clvm_tools';

const replServer = start({ prompt: '> ', useColors: true });

/* jshint ignore:start */
await clvm_tools.initialize();
/* jshint ignore:end */

// this lifts the last clvm_tools from form a parameter 
// to a retrn value so the repl can access it
var last_clvm_result;
clvm_tools.setPrintFunction((message) => last_clvm_result = message);

function do_clvm(command, ...args) {
    clvm_tools.go(command, ...args);

    return last_clvm_result;
}

initializeContext();

function initializeContext() {
    replServer.context.options = getSetting('.options', defaultOptions);
    replServer.context.run = (...args) => do_clvm('run', ...args);
    replServer.context.brun = (...args) => do_clvm('brun', ...args);
    replServer.context.opd = (...args) => do_clvm('opd', ...args);
    replServer.context.opc = (...args) => do_clvm('opc', ...args);
    replServer.context.read_ir = (...args) => do_clvm('read_ir', ...args);
}

function clearContext() {
    // clear all these out so they aren't available in the repl when not connected
    replServer.context.chiaServer = undefined;
    replServer.context.daemon = undefined;
    replServer.context.full_node = undefined;
    replServer.context.wallet = undefined;
    replServer.context.farmer = undefined;
    replServer.context.harvester = undefined;
    replServer.context.crawler = undefined;
}

function connect() {
    try {
        const chiaServer = new Chia(replServer.context.options);
        chiaServer.connect(() => {
            console.log('done');
            replServer.displayPrompt();
        },
        () => {
            clearContext();
            replServer.displayPrompt();
        });
        replServer.context.chiaServer = chiaServer;
        replServer.context.daemon = async (command, data) => chiaServer.sendCommand('daemon', command, data);
        replServer.context.full_node = async (command, data) => chiaServer.sendCommand('chia_full_node', command, data);
        replServer.context.wallet = async (command, data) => chiaServer.sendCommand('chia_wallet', command, data);
        replServer.context.farmer = async (command, data) => chiaServer.sendCommand('chia_farmer', command, data);
        replServer.context.harvester = async (command, data) => chiaServer.sendCommand('chia_harvester', command, data);
        replServer.context.crawler = async (command, data) => chiaServer.sendCommand('chia_crawler', command, data);
    } catch (e) {
        clearContext();
        replServer.displayPrompt();
    }
}

function disconnect() {
    if (replServer.context.chiaServer !== undefined) {
        replServer.context.chiaServer.disconnect();
        clearContext();
    }
}

replServer.on('reset', () => {
    disconnect();
    initializeContext();
});

replServer.on('exit', () => {
    disconnect();
    process.exit();
});

replServer.defineCommand('connect', {
    help: 'Opens the websocket connection to the chia daemon. Enables these awaitable functions: crawler, daemon, farmer, full_node, harvester, wallet',
    action() {
        if (replServer.context.chiaServer !== undefined) {
            console.log('Already connected. Use .disconnect first');
            replServer.displayPrompt();
        } else {
            connect();
        }
    }
});

replServer.defineCommand('disconnect', {
    help: 'Closes the websocket connection to the chia daemon',
    action() {
        if (replServer.context.chiaServer === undefined) {
            console.log('Not connected');
            replServer.displayPrompt();
        } else {
            disconnect();
        }
    }
});

replServer.defineCommand('save-options', {
    help: 'Saves the options',
    action() {
        saveSetting('.options', replServer.context.options);
        replServer.displayPrompt();
    }
});
