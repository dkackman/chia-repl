import * as settings from './settings.js';
import { defaultConnection } from './chia.js';
import * as bls from '@rigidity/bls-signatures';
import * as compiler from './compiler.js';
import _utils from 'chia-utils';

export function initializeContext(replServer, options) {
    const lastConnectionName = settings.getSetting('.lastConnectionName', '');
    replServer.context.connection = settings.getSetting(`${lastConnectionName}.connection`, defaultConnection);
    settings.fixup(replServer.context.connection, 'prefix', 'xch', 'Connection prefix not set. Setting to "xch". Double check the connection\'s properties and .save-connection.');

    // these are the various helper modules that don't require other state
    replServer.context.bls = bls;
    replServer.context.options = options;
    replServer.context.clvm = compiler.clvm_tools;
    replServer.context.utils = _utils;
    replServer.context.compile = (chiaLisp, prefix, ...args) => compiler.compile(chiaLisp, prefix !== undefined ? prefix : replServer.context.connection.prefix, ...args);
    replServer.context.test = (chiaLisp, compileArgs, programArgs) => compiler.test(chiaLisp, compileArgs, programArgs);
}

export function clearContext(replServer) {
    // clear all these out so they aren't available in the repl when not connected
    replServer.context.chiaServer = undefined;
    replServer.context.chia = undefined;
}
