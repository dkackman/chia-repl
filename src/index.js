import { start } from 'repl';
import { Chia } from './chia.js';
import * as settings from './settings.js';
import * as compiler from './compiler.js';
import utils from './chia-utils/chia-utils.js'; // temp fork unitl https://github.com/CMEONE/chia-utils/pull/7 is merged

const replServer = start({ prompt: '> ', useColors: true });

initializeContext();

function initializeContext() {
    const lastOptionName = settings.getSetting('.lastOptionName', '');
    const options = settings.getSetting(`${lastOptionName}.options`, settings.defaultOptions);
    settings.fixup(options, 'prefix', 'xch', 'Options prefix not set. Setting to "xch". Double check the options\' properties and .save-options.');

    replServer.context.options = options;

    // these are the various helper functions that don't require other state
    replServer.context.clvm_tools = compiler.clvm_tools;
    replServer.context.address_to_puzzle_hash = (address) => utils.address_to_puzzle_hash(address);
    replServer.context.puzzle_hash_to_address = (hash, prefix) => utils.puzzle_hash_to_address(hash, prefix !== undefined ? prefix : replServer.context.options.prefix);
    replServer.context.compile = (chiaLisp, prefix, ...args) => compiler.compile(chiaLisp, prefix !== undefined ? prefix : replServer.context.options.prefix, ...args);
    replServer.context.test = (chiaLisp, compileArgs, programArgs) => compiler.test(chiaLisp, compileArgs, programArgs);
}

function clearContext() {
    // clear all these out so they aren't available in the repl when not connected
    replServer.context.chiaServer = undefined;
    replServer.context.chia = undefined;
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
    replServer.context.chia = chiaServer.endpoints;
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
        settings.saveSetting(`${name}.options`, replServer.context.options);
        settings.saveSetting('.lastOptionName', name);
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
            settings.saveSetting('.lastOptionName', name);
            initializeContext();
        }

        replServer.displayPrompt();
    }
});
