import { ChiaDaemon } from './chia_daemon.js';
import * as settings from './settings.js';
import { defaultConnection } from './chia_daemon.js';
import * as bls from '@rigidity/bls-signatures';
import * as compiler from './compiler.js';
import _utils from 'chia-utils';
import chalk from 'chalk';

class ChiaRepl {
    constructor(replServer, options) {
        this.replServer = replServer;
        this.options = options;
        this.initializeContext(options);
    }

    ready() {
        console.log(chalk.green('Welcome to Chia!'));
        if (this.options.verbosity !== 'quiet') {
            console.log(chalk.gray('Type .help or .more-help to get started'));
        }

        if (this.options.autoConnect) {
            this.connect();
        }
        else {
            this.replServer.displayPrompt();
        }
    }

    connect() {
        const address = `wss://${this.replServer.context.connection.host}:${this.replServer.context.connection.port}`;
        console.log(`Connecting to ${address}...`);
        const chiaDeamon = new ChiaDaemon(this.replServer.context.connection);
        chiaDeamon.connect((msg) => {
            console.log(msg);
            this.replServer.displayPrompt();
        },
        (e) => {
            this.clearContext();
            console.log(e);
            this.replServer.displayPrompt();
        });
        this.replServer.context.chiaDeamon = chiaDeamon;
        this.replServer.context.chia = chiaDeamon.endpoints;
    }

    disconnect() {
        if (this.replServer.context.chiaDeamon !== undefined) {
            this.replServer.context.chiaDeamon.disconnect();
            this.clearContext();
        }
    }

    initializeContext(options) {
        const lastConnectionName = settings.getSetting('.lastConnectionName', '');
        this.replServer.context.connection = settings.getSetting(`${lastConnectionName}.connection`, defaultConnection);
        settings.fixup(this.replServer.context.connection, 'prefix', 'xch', 'Connection prefix not set. Setting to "xch". Double check the connection\'s properties and .save-connection.');

        // these are the various helper modules that don't require other state
        this.replServer.context.bls = bls;
        this.replServer.context.options = options;
        this.replServer.context.clvm = compiler.clvm_tools;
        this.replServer.context.utils = _utils;
        this.replServer.context.compile = (chiaLisp, prefix, ...args) => compiler.compile(chiaLisp, prefix !== undefined ? prefix : this.replServer.context.connection.prefix, ...args);
        this.replServer.context.test = (chiaLisp, compileArgs, programArgs) => compiler.test(chiaLisp, compileArgs, programArgs);
    }

    clearContext() {
        // clear all these out so they aren't available in the repl when not connected
        this.replServer.context.chiaDeamon = undefined;
        this.replServer.context.chia = undefined;
    }
}

const _ChiaRepl = ChiaRepl;
export { _ChiaRepl as ChiaRepl };
