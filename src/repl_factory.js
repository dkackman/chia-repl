import { start } from 'repl';
import createCompleterProxy from './completer.js';
import * as settings from './settings.js';
import chalk from 'chalk';
import ChiaRepl from './chia_repl.js';

// this module is responsible for creating and configuring the repl and ChiaRepl 
// instances and then smashing them together

export default function createRepl(cursor) {
    const chiaRepl = new ChiaRepl(start({ prompt: cursor, useColors: true }));

    chiaRepl.repl.completer = createCompleterProxy(chiaRepl.repl.completer);

    chiaRepl.repl.on('reset', () => {
        chiaRepl.disconnect(chiaRepl.repl);
        chiaRepl.loadConnection();
    });

    chiaRepl.repl.on('exit', () => chiaRepl.exit());

    chiaRepl.repl.defineCommand('connect', {
        help: 'Opens the websocket connection to the chia daemon using the currently loaded connection',
        async action() {
            if (chiaRepl.repl.context.chiaDaemon !== undefined) {
                console.log('Already connected. Use .disconnect first');
                chiaRepl.repl.displayPrompt();
            } else {
                await chiaRepl.connect();
            }
        }
    });

    chiaRepl.repl.defineCommand('disconnect', {
        help: 'Closes the websocket connection to the chia daemon',
        action() {
            if (chiaRepl.repl.context.chiaDaemon === undefined) {
                console.log('Not connected');
                chiaRepl.repl.displayPrompt();
            } else {
                chiaRepl.disconnect();
            }
        }
    });

    chiaRepl.repl.defineCommand('load-connection', {
        help: 'Loads a saved connection with an optional name',
        action(name) {
            if (chiaRepl.repl.context.chiaDaemon !== undefined) {
                console.log('Currently connected. Use .disconnect first');
            } else if (name !== undefined && !settings.settingExists(`${name}.connection`)) {
                console.log(`No connection named ${name} found`);
            } else {
                settings.saveSetting('.lastConnectionName', name);
                chiaRepl.loadConnection();
            }

            chiaRepl.repl.displayPrompt();
        }
    });

    chiaRepl.repl.defineCommand('list-connections', {
        help: 'Displays a list of saved connection names',
        action() {
            settings.listSettings().forEach(file => {
                if (file.endsWith('.connection')) {
                    console.log(file.replace('.connection', ''));
                    console.log(settings.getSetting(file));
                }
            });
            chiaRepl.repl.displayPrompt();
        }
    });

    chiaRepl.repl.defineCommand('save-options', {
        help: 'Saves the options',
        action() {
            settings.saveSetting('.options', chiaRepl.repl.context.options);
            chiaRepl.repl.displayPrompt();
        }
    });

    chiaRepl.repl.defineCommand('save-connection', {
        help: 'Saves the current connection with an optional name',
        action(name) {
            settings.saveSetting(`${name}.connection`, chiaRepl.repl.context.connection);
            settings.saveSetting('.lastConnectionName', name);
            chiaRepl.repl.displayPrompt();
        }
    });

    chiaRepl.repl.defineCommand('version', {
        help: 'Shows the version of this application',
        action() {
            console.log(settings.version);
            chiaRepl.repl.displayPrompt();
        }
    });

    chiaRepl.repl.defineCommand('listen', {
        help: 'Opens the websocket connection to the chia daemon and listens for `wallet_ui` messages',
        async action() {
            if (chiaRepl.repl.context.chiaDaemon !== undefined) {
                console.log('Currently connected. Use .disconnect first');
            } else {
                await chiaRepl.connect('wallet_ui');
                await chiaRepl.repl.context.chiaDaemon.listen();
                chiaRepl.disconnect();
            }

            chiaRepl.repl.displayPrompt();
        }
    });

    chiaRepl.repl.defineCommand('more-help', {
        help: 'Shows more help about using the environment',
        action() {
            console.log('These global objects are available within the REPL environment');
            console.log(`${chalk.green('bls')}\t\tBLS signature functions`);
            console.log(`${chalk.green('chia')}\t\tChia node rpc services. This object is only availble after a successful .connect`);
            console.log('\t\tAll functions on these chia services are async & awaitable: crawler, daemon, farmer, full_node, harvester, wallet');
            console.log(`${chalk.green('clvm')}\t\tCLVM functions (run, brun, opc, opd, read_ir)`);
            console.log(`${chalk.green('utils')}\t\tChia-utils (bech32m and other helpers)`);
            console.log(`${chalk.green('connection')}\tProperties of the current connection`);
            console.log(`${chalk.green('options')}\t\tConfigurable REPl options`);
            console.log(`${chalk.green('repl.builtinModules')}\n\t\tShow other available builtin node modules`);

            console.log('\nThese global functions are invocable within the REPL environment');
            console.log(`${chalk.green('compile')}${chalk.gray('(chiaLisp, prefix, ...compileArgs)')}`);
            console.log('\t\tCompiles a chialisp program into its address, clvm, puzzle, and puzzle_hash');
            console.log(`${chalk.green('test')}${chalk.gray('(chiaLisp, compileArgs = [], programArgs = []))')}`);
            console.log('\t\tRuns a chialisp program and displays its output');

            chiaRepl.repl.displayPrompt();
        }
    });

    return chiaRepl;
}
