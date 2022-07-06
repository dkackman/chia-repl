import { ChiaDaemon, localDaemonConnection } from 'chia-daemon';
import * as settings from './settings.js';
import * as bls from '@rigidity/bls-signatures';
import * as compiler from './compiler.js';
import _utils from 'chia-utils';
import chalk from 'chalk';
import listener from './listen.js';

// this exists in order to bring together the node repl, the chia deamon 
// and all the other chia specific tools and utilities
class ChiaRepl {
    constructor(repl, options) {
        this._repl = repl;
        this.options = options;
    }

    get repl() { return this._repl; }

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

    async connect(service_name = 'chia_repl') {
        const chiaDaemon = new ChiaDaemon(this.repl.context.connection, service_name);
        chiaDaemon.on('connecting', (address) => {
            console.log(`Connecting to ${address}...`);
        });

        chiaDaemon.on('connected', () => {
            console.log('Connected');
            this.repl.displayPrompt();
        });

        chiaDaemon.on('disconnected', () => {
            this.clearChiaContext();
            console.log('Disconnected');
            this.repl.displayPrompt();
        });

        chiaDaemon.on('error', (e) => {
            this.clearChiaContext();
            console.log(e);
            this.repl.displayPrompt();
        });

        chiaDaemon.listen = async () => await listener(chiaDaemon);

        if (await chiaDaemon.connect()) {
            this.repl.context.chiaDaemon = chiaDaemon;
            this.repl.context.chia = chiaDaemon.services;
        }
    }

    disconnect() {
        if (this.repl.context.chiaDaemon !== undefined) {
            this.repl.context.chiaDaemon.disconnect();
        }
    }

    loadConnection() {
        const lastConnectionName = settings.getSetting('.lastConnectionName', '');
        this.repl.context.connection = settings.getSetting(`${lastConnectionName}.connection`, localDaemonConnection);
        settings.fixup(this.repl.context.connection, 'prefix', 'xch', 'Connection prefix not set. Setting to "xch". Double check the connection\'s properties and .save-connection.');
    }

    clearChiaContext() {
        // clear all these out so they aren't available in the repl when not connected
        this.repl.context.chiaDaemon = undefined;
        this.repl.context.chia = undefined;
    }

    exit() {
        this.disconnect();
        process.exit();
    }
}

const _ChiaRepl = ChiaRepl;
export { _ChiaRepl as default };
