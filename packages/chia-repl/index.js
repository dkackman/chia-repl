#! /usr/bin/env node
import createRepl from './repl_factory.js';
import * as settings from './settings.js';
import * as _options from './options.js';
import _ from 'lodash';

// application entry point only - don't put anything else in here
const options = settings.getSettingObject('.options', _options.defaultOptions);
const chiaRepl = createRepl(options.cursor);
/* jshint ignore:start */
await chiaRepl.ready(options);
/* jshint ignore:end */

// this is used by the CI build test script to see if we can start cleanly and exit
if (_.last(process.argv) === 'test') {
    chiaRepl.exit();
}
