import { ChiaDaemon, localDaemonConnection } from 'chia-daemon';
import * as settings from './settings.js';
import * as bls from '@rigidity/bls-signatures';
import * as compiler from './compiler.js';
import _utils from 'chia-utils';
import chalk from 'chalk';
import listener from './listen.js';
import clvm from 'clvm';
import { ContentHasher, MetadataFactory, NftMinter } from 'chia-nft-minter';
import loadModules from './moduleLoader.js';

/* jshint ignore:start */
await clvm.initialize();
/* jshint ignore:end */

// this exists in order to bring together the node repl, the chia deamon
// and all the other chia specific tools and utilities
export default class ChiaRepl {
    constructor(repl) {
        this._repl = repl;
    }

    get repl() { return this._repl; }

    async ready(options) {
        // these are the various helper modules that don't require the websocket connection
        this.repl.context.bls = bls;
        this.repl.context.options = options;
        this.repl.context.clvm_tools = compiler.clvm_tools;
        this.repl.context.clvm = clvm;
        this.repl.context.utils = _utils;
        this.repl.context.compile = (chiaLisp, prefix, ...args) => compiler.compile(chiaLisp, prefix !== undefined ? prefix : this.repl.context.connection.prefix, ...args);
        this.repl.context.test = (chiaLisp, compileArgs, programArgs) => compiler.test(chiaLisp, compileArgs, programArgs);

        // this is nft stuff that doesn't need the connection
        this.repl.context.contentHasher = new ContentHasher();
        this.repl.context.metadataFactory = new MetadataFactory('chia-repl');

        this.loadConnection();

        console.log(chalk.green('Welcome to Chia!'));
        if (options.verbosity !== 'quiet') {
            console.log(chalk.gray('Type .help or .more-help to get started'));
            console.log(`\nCurrent connection address is wss://${chalk.blue(this.repl.context.connection.host)}:${this.repl.context.connection.port}`);
        }

        if (options.autoConnect) {
            await this.connect();
        } else {
            this.repl.displayPrompt();
        }
    }

    async connect(service_name = 'chia_repl') {
        const chiaDaemon = new ChiaDaemon(this.repl.context.connection, service_name);
        chiaDaemon.once('connecting', (address) => console.log(`Connecting to ${address}...`));

        chiaDaemon.once('connected', () => console.log('Connected'));

        chiaDaemon.once('disconnected', () => {
            this.clearChiaContext();
            console.log('Disconnected');
            this.repl.displayPrompt();
        });

        chiaDaemon.on('socket-error', (e) => {
            this.clearChiaContext();
            console.log(e);
            this.repl.displayPrompt();
        });

        chiaDaemon.listen = async () => await listener(chiaDaemon);


        if (await chiaDaemon.connect()) {
            this.repl.context.chiaDaemon = chiaDaemon;
            this.repl.context.chia = chiaDaemon.services;

            const ipfsToken = this.repl.context.options.ipfsToken;
            if (ipfsToken !== undefined && ipfsToken.length > 0) {
                this.repl.context.minter = new NftMinter(chiaDaemon.services.wallet, ipfsToken);
                await loadModules(this.repl.context, this.repl.context.options.scriptFolder);
            } else if (this.repl.context.options.verbosity !== 'quiet') {
                console.log(chalk.grey('No ipfs token is set. Set `ipfsToken` on the options object and reconnect to use NFT functions'));
            }

            this.repl.displayPrompt();
            return true;
        }

        return false;
    }

    disconnect() {
        if (this.repl.context.chiaDaemon !== undefined) {
            this.repl.context.chiaDaemon.disconnect();
        }
    }

    loadConnection() {
        const lastConnectionName = settings.getSetting('.lastConnectionName', '');
        const defaultSettings = localDaemonConnection;
        defaultSettings.prefix = 'xch';

        this.repl.context.connection = settings.getSettingObject(`${lastConnectionName}.connection`, defaultSettings);
    }

    clearChiaContext() {
        if (this.repl.context.chiaDaemon !== undefined) {
            this.repl.context.chiaDaemon.removeAllListeners('socket-error');
        }

        // clear all these out so they aren't available in the repl when not connected
        this.repl.context.chiaDaemon = undefined;
        this.repl.context.minter = undefined;
        this.repl.context.chia = undefined;
    }

    exit() {
        this.disconnect();
        process.exit();
    }
}
