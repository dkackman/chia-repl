#! /usr/bin/env node
import { createRepl } from './repl_factory.js';
import * as settings from './settings.js';
import * as _options from './options.js';

const options = settings.getSetting('.options', _options.defaultOptions);
const chiaRepl = createRepl(options);
chiaRepl.ready();
