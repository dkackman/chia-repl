import { start } from 'repl';
import createCompleterProxy from './completer.js';
import * as settings from './settings.js';
import chalk from 'chalk';
import ChiaRepl from './chia_repl.js';
import { Compiler } from './compiler.js';

// this module is responsible for creating and configuring the repl and ChiaRepl 
// instances and then smashing them together

export default function createRepl(options) {
    const repl = start({ prompt: options.cursor, useColors: true });
    const chiaRepl = new ChiaRepl(repl, options);

    repl.completer = createCompleterProxy(repl.completer);

    repl.on('reset', () => {
        chiaRepl.disconnect(repl);
        chiaRepl.loadConnection();
    });

    repl.on('exit', () => chiaRepl.exit());

    repl.defineCommand('connect', {
        help: 'Opens the websocket connection to the chia daemon using the currently loaded connection',
        action() {
            if (repl.context.chiaDeamon !== undefined) {
                console.log('Already connected. Use .disconnect first');
                repl.displayPrompt();
            } else {
                chiaRepl.connect();
            }
        }
    });

    repl.defineCommand('disconnect', {
        help: 'Closes the websocket connection to the chia daemon',
        action() {
            if (repl.context.chiaDeamon === undefined) {
                console.log('Not connected');
                repl.displayPrompt();
            } else {
                chiaRepl.disconnect();
            }
        }
    });

    repl.defineCommand('load-connection', {
        help: 'Loads a saved connection with an optional name',
        action(name) {
            if (repl.context.chiaDeamon !== undefined) {
                console.log('Currently connected. Use .disconnect first');
            } else if (name !== undefined && !settings.settingExists(`${name}.connection`)) {
                console.log(`No connection named ${name} found`);
            } else {
                settings.saveSetting('.lastConnectionName', name);
                chiaRepl.loadConnection();
            }

            repl.displayPrompt();
        }
    });

    repl.defineCommand('list-connections', {
        help: 'Displays a list of saved connection names',
        action() {
            settings.listSettings().forEach(file => {
                if (file.endsWith('.connection')) {
                    console.log(file.replace('.connection', ''));
                    console.log(settings.getSetting(file));
                }
            });
            repl.displayPrompt();
        }
    });

    repl.defineCommand('save-options', {
        help: 'Saves the options',
        action() {
            settings.saveSetting('.options', repl.context.options);
            repl.context.compiler = new Compiler(repl.context.options);
            repl.displayPrompt();
        }
    });

    repl.defineCommand('save-connection', {
        help: 'Saves the current connection with an optional name',
        action(name) {
            settings.saveSetting(`${name}.connection`, repl.context.connection);
            settings.saveSetting('.lastConnectionName', name);
            repl.displayPrompt();
        }
    });

    repl.defineCommand('version', {
        help: 'Shows the version of this application',
        action() {
            console.log(settings.version);
            repl.displayPrompt();
        }
    });

    repl.defineCommand('more-help', {
        help: 'Shows more help about using the environment',
        action() {
            console.log('These global objects are available within the REPL environment');
            console.log(`${chalk.green('bls')}\t\tBLS signature functions`);
            console.log(`${chalk.green('chia')}\t\tChia node rpc services. This object is only availble after a successful .connect`);
            console.log('\t\tAll functions on these chia services are async & awaitable: crawler, daemon, farmer, full_node, harvester, wallet');
            console.log(`${chalk.green('compiler')}\tCLVM functions (run, brun, opc, opd, read_ir)`);
            console.log(`${chalk.green('utils')}\t\tChia-utils (bech32m and other helpers)`);
            console.log(`${chalk.green('connection')}\tProperties of the current connection`);
            console.log(`${chalk.green('options')}\t\tConfigurable REPl options`);
            console.log(`${chalk.green('repl.builtinModules')}\n\t\tShow other available builtin node modules`);

            repl.displayPrompt();
        }
    });

    return chiaRepl;
}
