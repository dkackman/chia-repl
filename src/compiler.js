import * as _clvm_tools from 'clvm_tools';
import utils from './chia-utils/chia-utils.js'; // temp fork unitl https://github.com/CMEONE/chia-utils/pull/7 is merged
import * as fs from 'fs';

/* jshint ignore:start */
await _clvm_tools.initialize();
/* jshint ignore:end */

export let clvm_tools = {
    run: (...args) => do_clvm('run', ...args),
    brun: (...args) => do_clvm('brun', ...args),
    opd: (...args) => do_clvm('opd', ...args),
    opc: (...args) => do_clvm('opc', ...args),
    read_ir: (...args) => do_clvm('read_ir', ...args),
};

export function compile(chiaLisp, prefix, ...args) {
    const clvm = do_clvm("run", chiaLisp, ...args);
    const hash = do_clvm("opc", '-H', clvm);
    const puzzle = do_clvm("opc", clvm);
    const address = utils.puzzle_hash_to_address(hash, prefix);

    // if the source is a file, load the contents and attach to result
    //if (fs.existsSync(chiaLisp)) {
    //    chiaLisp = fs.readFileSync(chiaLisp).toString();
    //}

    return {
        address: address,
        clvm: clvm,
        puzzle: puzzle,
        puzzle_hash: hash,
        //source: chiaLisp,
    };
}

export function test(chiaLisp, compileArgs = [], programArgs = []) {
    const clvm = do_clvm("run", chiaLisp, ...compileArgs);
    return do_clvm('brun', clvm, ...programArgs);
}

// this lifts the last clvm_tools result form a parameter 
// to a return value so the repl can access it
let last_clvm_result;
_clvm_tools.setPrintFunction((message) => last_clvm_result = message);

export function do_clvm(command, ...args) {
    _clvm_tools.go(command, ...args);

    return last_clvm_result;
}
