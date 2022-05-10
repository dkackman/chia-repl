#! /usr/bin/env node
import { createRepl } from './repl_factory.js';
import * as settings from './settings.js';
import * as _options from './options.js';
import _ from 'lodash';

const options = settings.getSetting('.options', _options.defaultOptions);
const chiaRepl = createRepl(options);
chiaRepl.ready();

// this is used by the test script to see if we can start cleanly 
// and exit from the CI build. 
if (_.last(process.argv) === 'test') {
    chiaRepl.exit();
}
