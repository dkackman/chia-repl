import { start } from 'repl';
import { createCompleterProxy } from './completer.js';
import * as settings from './settings.js';
import * as context_manager from './context_manager.js';
import * as connection_manager from './connection_manager.js';
import chalk from 'chalk';

export function createRepl(options) {
    const replServer = start({ prompt: options.cursor, useColors: true });
    replServer.completer = createCompleterProxy(replServer.completer);
    context_manager.initializeContext(replServer, options);
    
    replServer.on('reset', () => {
        connection_manager.disconnect(replServer);
        context_manager.initializeContext(replServer, options);
    });
    
    replServer.on('exit', () => {
        connection_manager.disconnect(replServer);
        process.exit();
    });
    
    replServer.defineCommand('connect', {
        help: 'Opens the websocket connection to the chia daemon using the currently loaded connection',
        action() {
            if (replServer.context.chiaServer !== undefined) {
                console.log('Already connected. Use .disconnect first');
                replServer.displayPrompt();
            } else {
                connection_manager.connect(replServer);
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
                connection_manager.disconnect(replServer);
            }
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
                context_manager.initializeContext(replServer, options);
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
    
    replServer.defineCommand('save-connection', {
        help: 'Saves the current connection with an optional name',
        action(name) {
            settings.saveSetting(`${name}.connection`, replServer.context.connection);
            settings.saveSetting('.lastConnectionName', name);
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
            console.log(`${chalk.green('repl.builtinModules')}\n\t\tShow other available builtin node modules`);

            console.log('\nThese global functions are invocable within the REPL environment');
            console.log(`${chalk.green('compile')}${chalk.gray('(chiaLisp, prefix, ...compileArgs)')}`);
            console.log('\t\tCompiles a chialisp program into its address, clvm, puzzle, and puzzle_hash');
            console.log(`${chalk.green('test')}${chalk.gray('(chiaLisp, compileArgs = [], programArgs = []))')}`);
            console.log('\t\tRuns a chialisp program and displays its output');
    
            replServer.displayPrompt();
        }
    });
    
    return replServer;
}