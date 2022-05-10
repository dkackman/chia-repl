#! /usr/bin/env node
import { start } from 'repl';
import { Chia, defaultConnection } from './chia.js';
import * as bls from '@rigidity/bls-signatures';
import * as settings from './settings.js';
import * as _options from './options.js';
import * as compiler from './compiler.js';
import _utils from 'chia-utils'; 
import { createCompleterProxy } from './completer.js';
import chalk from 'chalk';

const options = settings.getSetting('.options', _options.defaultOptions);
const replServer = start({ prompt: options.cursor, useColors: true });
replServer.completer = createCompleterProxy(replServer.completer);

initializeContext();
console.log(chalk.green('Welcome to Chia!'));
if (options.verbosity !== 'quiet') {
    console.log(chalk.gray('Type .help or .more-help to get started'));
}

if (options.autoConnect) {
    connect();
}
else {
    replServer.displayPrompt();
}

function initializeContext() {
    const lastConnectionName = settings.getSetting('.lastConnectionName', '');
    replServer.context.connection = settings.getSetting(`${lastConnectionName}.connection`, defaultConnection);
    settings.fixup(replServer.context.connection, 'prefix', 'xch', 'Connection prefix not set. Setting to "xch". Double check the connection\'s properties and .save-connection.');

    // these are the various helper modules that don't require other state
    replServer.context.bls = bls;
    replServer.context.options = options;
    replServer.context.clvm = compiler.clvm_tools;
    replServer.context.utils = _utils;
    replServer.context.compile = (chiaLisp, prefix, ...args) => compiler.compile(chiaLisp, prefix !== undefined ? prefix : replServer.context.connection.prefix, ...args);
    replServer.context.test = (chiaLisp, compileArgs, programArgs) => compiler.test(chiaLisp, compileArgs, programArgs);
}

function clearContext() {
    // clear all these out so they aren't available in the repl when not connected
    replServer.context.chiaServer = undefined;
    replServer.context.chia = undefined;
}

function connect() {
    const address = `wss://${replServer.context.connection.host}:${replServer.context.connection.port}`;
    console.log(`Connecting to ${address}...`);
    const chiaServer = new Chia(replServer.context.connection);
    chiaServer.connect((msg) => {
        console.log(msg);
        replServer.displayPrompt();
    },
        (e) => {
            clearContext();
            console.log(e);
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
    help: 'Opens the websocket connection to the chia daemon using the currently loaded connection',
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

replServer.defineCommand('save-connection', {
    help: 'Saves the current connection with an optional name',
    action(name) {
        settings.saveSetting(`${name}.connection`, replServer.context.connection);
        settings.saveSetting('.lastConnectionName', name);
        replServer.displayPrompt();
    }
});

replServer.defineCommand('load-connection', {
    help: 'Loads a saved connection with an optional name',
    action(name) {
        if (replServer.context.chiaServer !== undefined) {
            console.log('Currently connected. Use .disconnect first');
        } else if (name !== undefined && !settings.settingExists(`${name}.connection`)) {
            console.log(`No connection named ${name} found`);
        } else {
            settings.saveSetting('.lastConnectionName', name);
            initializeContext();
        }

        replServer.displayPrompt();
    }
});

replServer.defineCommand('list-connections', {
    help: 'Displays a list of saved connection names',
    action() {
        settings.listSettings().forEach(file => {
            if (file.endsWith('.connection')) {
                console.log(file.replace('.connection', ''));
                console.log(settings.getSetting(file));
            }
        });
        replServer.displayPrompt();
    }
});

replServer.defineCommand('save-options', {
    help: 'Saves the options',
    action() {
        settings.saveSetting('.options', replServer.context.options);
        replServer.displayPrompt();
    }
});

replServer.defineCommand('more-help', {
    help: 'Shows more help about using the environment',
    action() {
        console.log('These global objects are available within the REPL environment');
        console.log(`${chalk.green('bls')}\t\tBLS signature functions`);
        console.log(`${chalk.green('chia')}\t\tChia node rpc endpoints. This object is only availble after a successful .connect`);
        console.log('\t\tAll functions on these chia services are async & awaitable: crawler, daemon, farmer, full_node, harvester, wallet');
        console.log(`${chalk.green('clvm')}\t\tCLVM functions (run, brun, opc, opd, read_ir)`);
        console.log(`${chalk.green('utils')}\t\tChia-utils (bech32m and other helpers)`);
        console.log(`${chalk.green('connection')}\tProperties of the current connection`);
        console.log(`${chalk.green('options')}\t\tConfigurable REPl options`);

        console.log('\nThese global functions are invocable within the REPL environment');
        console.log(`${chalk.green('compile')}${chalk.gray('(chiaLisp, prefix, ...compileArgs)')}`);
        console.log('\t\tCompiles a chialisp program into its address, clvm, puzzle, and puzzle_hash');
        console.log(`${chalk.green('test')}${chalk.gray('(chiaLisp, compileArgs = [], programArgs = []))')}`);
        console.log('\t\tRuns a chialisp program and displays its output');

        replServer.displayPrompt();
    }
});
