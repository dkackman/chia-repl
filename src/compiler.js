import * as _clvm_tools from 'clvm_tools';
import _utils from './chia-utils/chia-utils.js'; // temp fork unitl https://github.com/CMEONE/chia-utils/pull/7 is merged

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

export let utils = {
    puzzle_hash_to_address: (hash, prefix) => utils.puzzle_hash_to_address(hash, prefix !== undefined ? prefix : replServer.context.options.prefix),
    address_to_puzzle_hash: (address) => utils.address_to_puzzle_hash(address),
};


export function compile(chiaLisp, prefix, ...args) {
    const clvm = do_clvm("run", chiaLisp, ...args);
    const hash = do_clvm("opc", '-H', clvm);
    const puzzle = do_clvm("opc", clvm);
    const address = _utils.puzzle_hash_to_address(hash, prefix);

    return {
        address: address,
        clvm: clvm,
        puzzle: puzzle,
        puzzle_hash: hash,
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
