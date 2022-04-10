import * as clvm_tools from 'clvm_tools';
import utils from './chia-utils/chia-utils.js'; // temp fork unitl https://github.com/CMEONE/chia-utils/pull/7 is merged
import * as fs from 'fs';

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

// this lifts the last clvm_tools result form a parameter 
// to a return value so the repl can access it
let last_clvm_result;
clvm_tools.setPrintFunction((message) => last_clvm_result = message);

export function do_clvm(command, ...args) {
    clvm_tools.go(command, ...args);

    return last_clvm_result;
}
