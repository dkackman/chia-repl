#! /usr/bin/env node
import { createRepl } from './repl_factory.js';
import * as connection_manager from './connection_manager.js';
import * as settings from './settings.js';
import * as _options from './options.js';
import chalk from 'chalk';

const options = settings.getSetting('.options', _options.defaultOptions);
const replServer = createRepl(options);

console.log(chalk.green('Welcome to Chia!'));
if (options.verbosity !== 'quiet') {
    console.log(chalk.gray('Type .help or .more-help to get started'));
}

if (options.autoConnect) {
    connection_manager.connect(replServer);
}
else {
    replServer.displayPrompt(replServer);
}
