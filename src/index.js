import { start } from 'repl';
import { Chia } from './chia.js';
import { getSetting, saveSetting, defaultOptions, settingExists } from './settings.js';
import * as compiler from './compiler.js';
import utils from './chia-utils/chia-utils.js'; // temp fork unitl https://github.com/CMEONE/chia-utils/pull/7 is merged
import * as clvm_tools from 'clvm_tools';

const replServer = start({ prompt: '> ', useColors: true });

/* jshint ignore:start */
await clvm_tools.initialize();
/* jshint ignore:end */

initializeContext();

function initializeContext() {
    const lastOptionName = getSetting('.lastOptionName', '');
    replServer.context.options = getSetting(`${lastOptionName}.options`, defaultOptions);
    // these are the various helper functions that don't require other state
    replServer.context.run = (...args) => compiler.do_clvm('run', ...args);
    replServer.context.brun = (...args) => compiler.do_clvm('brun', ...args);
    replServer.context.opd = (...args) => compiler.do_clvm('opd', ...args);
    replServer.context.opc = (...args) => compiler.do_clvm('opc', ...args);
    replServer.context.read_ir = (...args) => compiler.do_clvm('read_ir', ...args);
    replServer.context.address_to_puzzle_hash = (address) => utils.address_to_puzzle_hash(address);
    replServer.context.puzzle_hash_to_address = (hash, prefix = 'xch') => utils.puzzle_hash_to_address(hash, prefix);
    replServer.context.compile = (chiaLisp, prefix, ...args) => compiler.compile(chiaLisp, prefix, ...args);
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
    help: 'Saves the options (name is optional)',
    action(name) {
        saveSetting(`${name}.options`, replServer.context.options);
        saveSetting('.lastOptionName', name);
        replServer.displayPrompt();
    }
});

replServer.defineCommand('load-options', {
    help: 'Loads options (name is optional)',
    action(name) {
        if (replServer.context.chiaServer !== undefined) {
            console.log('Currently connected. Use .disconnect first');
        } else if (name !== undefined && !settingExists(`${name}.options`)) {
            console.log(`No options with name ${name} found`);
        } else {
            saveSetting('.lastOptionName', name);
            initializeContext();
        }

        replServer.displayPrompt();
    }
});
