import { ChiaDaemon, localDaemonConnection } from 'chia-daemon';
import * as settings from './settings.js';
import * as bls from '@rigidity/bls-signatures';
import * as compiler from './compiler.js';
import _utils from 'chia-utils';
import chalk from 'chalk';

// this exists in order to bring together the node repl, the chia deamon 
// and all the other chia specfic tools and utilities
class ChiaRepl {
    constructor(repl, options) {
        this.repl = repl;
        this.options = options;
    }

    ready() {
        // these are the various helper modules that don't require other state
        this.repl.context.bls = bls;
        this.repl.context.options = this.options;
        this.repl.context.clvm = compiler.clvm_tools;
        this.repl.context.utils = _utils;
        this.repl.context.compile = (chiaLisp, prefix, ...args) => compiler.compile(chiaLisp, prefix !== undefined ? prefix : this.repl.context.connection.prefix, ...args);
        this.repl.context.test = (chiaLisp, compileArgs, programArgs) => compiler.test(chiaLisp, compileArgs, programArgs);

        this.loadConnection();

        console.log(chalk.green('Welcome to Chia!'));
        if (this.options.verbosity !== 'quiet') {
            console.log(chalk.gray('Type .help or .more-help to get started'));
        }

        if (this.options.autoConnect) {
            this.connect();
        }
        else {
            this.repl.displayPrompt();
        }
    }

    async connect() {
        const chiaDeamon = new ChiaDaemon(this.repl.context.connection);
        chiaDeamon.on('connecting', (address) => {
            console.log(`Connecting to ${address}...`);
        });

        chiaDeamon.on('connected', () => {
            console.log('Connected');
            this.repl.displayPrompt();
        });

        chiaDeamon.on('disconnected', () => {
            this.clearChiaContext();
            console.log('Disconnected');
            this.repl.displayPrompt();
        });

        chiaDeamon.on('error', (e) => {
            this.clearChiaContext();
            console.log(e);
            this.repl.displayPrompt();
        });

        if (await chiaDeamon.connect()) {
            this.repl.context.chiaDeamon = chiaDeamon;
            this.repl.context.chia = chiaDeamon.services;
        }
    }

    disconnect() {
        if (this.repl.context.chiaDeamon !== undefined) {
            this.repl.context.chiaDeamon.disconnect();
        }
    }

    loadConnection() {
        const lastConnectionName = settings.getSetting('.lastConnectionName', '');
        this.repl.context.connection = settings.getSetting(`${lastConnectionName}.connection`, localDaemonConnection);
        settings.fixup(this.repl.context.connection, 'prefix', 'xch', 'Connection prefix not set. Setting to "xch". Double check the connection\'s properties and .save-connection.');
    }

    clearChiaContext() {
        // clear all these out so they aren't available in the repl when not connected
        this.repl.context.chiaDeamon = undefined;
        this.repl.context.chia = undefined;
    }

    exit() {
        this.disconnect();
        process.exit();
    }
}

const _ChiaRepl = ChiaRepl;
export { _ChiaRepl as default };
