# chia-repl

[![CodeQL](https://github.com/dkackman/chia-repl/actions/workflows/codeql.yml/badge.svg)](https://github.com/dkackman/chia-repl/actions/workflows/codeql.yml)
[![Node.js CI](https://github.com/dkackman/chia-repl/actions/workflows/node.js.yml/badge.svg)](https://github.com/dkackman/chia-repl/actions/workflows/node.js.yml)
[![NPM](https://nodei.co/npm/chia-repl.png?mini=true)](https://npmjs.org/package/chia-repl)

A REPL tool for Chia that incorporates various chia and crypto utilities in a single, interactive node environent.

- [Chia RPC](https://dkackman.github.io/chia-api/)
- [clvm_tools-js](https://github.com/Chia-Mine/clvm_tools-js)
- [clvm-js](https://github.com/Chia-Mine/clvm-js)
- [chia-utils](https://github.com/CMEONE/chia-utils)
- [@rigidity/bls-signatures](https://github.com/Rigidity/bls-signatures)

## Packaged

```shell
npm install -g chia-repl
chia-repl
🌿 Welcome to Chia!
🌿 
```

## From Source

```shell
cd src
npm install
npm start
> chia-repl@0.9.1 start
> node index.js

🌿 Welcome to Chia!
🌿 
```

Uses the [node repl](https://nodejs.org/api/repl.html) so the CLI works like node's.

## Commands

REPL commands always start with `.` and are lsited with `.help`.

```bash
🌿 .help
.break              Sometimes you get stuck, this gets you out
.clear              Break, and also clear the local context
.connect            Opens the websocket connection to the chia daemon using the currently loaded connection
.credits            Shows credits for the various tool authors
.disconnect         Closes the websocket connection to the chia daemon
.editor             Enter editor mode
.exit               Exit the REPL
.help               Print this help message
.list-connections   Displays a list of saved connection names
.listen             Opens the websocket connection to the chia daemon and listens for `wallet_ui` messages
.load               Load JS from a file into the REPL session
.load-connection    Loads a saved connection with an optional name
.more-help          Shows more help about using the environment
.save               Save all evaluated commands in this REPL session to a file
.save-connection    Saves the current connection with an optional name
.save-options       Saves the options
.version            Shows the version of this application

Press Ctrl+C to abort current expression, Ctrl+D to exit the REPL
🌿
```

## Globals

Various global objects and functions are available within the REPL environment and can be listed with `.more-help`.
Some of these configure the connection and REPL options, while other enable interaction with the chia node, utility functions, and the clvm.

```bash
🌿 .more-help
These global objects are available within the REPL environment
bls             BLS signature functions
chia            Chia node rpc services. This object is only availble after a successful .connect
                All functions on these chia services are async & awaitable: crawler, daemon, farmer, full_node, harvester, wallet
clvm_tools      clvm_tools-js functions (run, brun, opc, opd, read_ir)
clvm            clvm-js (Program, SExp etc.)
utils           Chia-utils (bech32m and other helpers)
connection      Properties of the current connection
options         Configurable REPl options
repl.builtinModules
                Show other available builtin node modules

These global functions are invocable within the REPL environment
compile(chiaLisp, prefix, ...compileArgs)
                Compiles a chialisp program into its address, clvm, puzzle, and puzzle_hash
test(chiaLisp, compileArgs = [], programArgs = []))
                Runs a chialisp program and displays its output
```

## Examples

The global `connection` context object has the host, port, and path to cert files. These properties can be set inside the repl with `connection.host = "my-host"` etc.
Once connected to the `daemon` each of the service endpoints becomes availalbe as an awaitable context function.

Knowing [the chia rpc api](https://dkackman.github.io/chia-api/) will help immensely. All endpoints and data payloads should work. Since it is a full nodejs REPL environment, core modules like `fs` and `http` are available.

### Run a CLVM Program

```javascript
const {SExp, OPERATOR_LOOKUP, KEYWORD_TO_ATOM, h, t, run_program} = clvm;
const plus = h(KEYWORD_TO_ATOM["+"]);
const q = h(KEYWORD_TO_ATOM["q"]);
const program = SExp.to([plus, 1, t(q, 175)]);
const env = SExp.to(25);
const [cost, result] = run_program(program, env, OPERATOR_LOOKUP);
let isEqual = result.equal_to(SExp.to(25 + 175));
isEqual = result.as_int() === (25 + 175);
true
```

### Compile a Simple Program with clvm_tools

```lisp
🌿 clvm_tools.run("(mod ARGUMENT (+ ARGUMENT 3))")
'(+ 1 (q . 3))'
🌿 clvm_tools.brun(_, '1')
'4'
🌿
```

### Compile a Simple Program From a File

```lisp
🌿 clvm_tools.run('../examples/factorial.clsp')
'(a (q 2 2 (c 2 (c 5 ()))) (c (q 2 (i (= 5 (q . 1)) (q 1 . 1) (q 18 5 (a 2 (c 2 (c (- 5 (q . 1)) ()))))) 1) 1))'
🌿 clvm_tools.brun(_, '(5)')
'120'
🌿
```

### Compile a ChiaLisp Program

```lisp
🌿 compile('../examples/piggybank.clsp', 'xch', '-i../examples/include')
{
  address: 'tcxh1smq2mvt8mdmulp7q5tvwh8rn8g6u8ykfr5020a3aj3mj3hsha5ns3zea78',
  clvm: '(a (q 2 (i (> 11 5) (q 2 (i (> 11 14) (q 4 (c 10 (c 4 (c 11 ()))) (c (c 10 (c 23 (q ()))) ())) (q 4 (c 10 (c 23 (c 11 ()))) ())) 1) (q 8)) 1) (c (q 0xcafef00d 51 . 500) 1))', 
  puzzle: 'ff02ffff01ff02ffff03ffff15ff0bff0580ffff01ff02ffff03ffff15ff0bff0e80ffff01ff04ffff04ff0affff04ff04ffff04ff0bff80808080ffff04ffff04ff0affff04ff17ffff01ff80808080ff808080ffff01ff04ffff04ff0affff04ff17ffff04ff0bff80808080ff808080ff0180ffff01ff088080ff0180ffff04ffff01ff84cafef00dff338201f4ff018080',
  puzzle_hash: '86c0adb167db77cf87c0a2d8eb9c733a35c392c91d1ea7f63d947728de17ed27'
}
```

### Test a ChiaLisp Program

```lisp
🌿 test('(mod ARGUMENT (+ ARGUMENT 3))', [], [ '15' ])
'18'
```

### Connecting and Calling a Node Function

```javascript
🌿 .connect
Connecting to wss://localhost:55400...
done
🌿 await chia.full_node.get_network_info()
{ network_name: 'testnet10', network_prefix: 'txch', success: true }
🌿
```

### Chaining Calls

Since it is a javascript environment, variables can be defined and set, and are preserved through. The [special value](https://nodejs.org/api/repl.html#assignment-of-the-_-underscore-variable) `_` can also be used to chain function calls.

```javascript
🌿 await chia.full_node.get_blockchain_state()
blockchain_state: {
  ...
}
🌿 _.blockchain_state.peak.header_hash
'0x098b7fd5768174776eb4a29cedcabffb21c487b592c73f72ac33bc4ffecf6c38'
🌿 await chia.full_node.get_block({ header_hash: _ })
{
  block: {
    ...
  }
}
🌿
```

### Helpers for RPC Payloads

```javascript
🌿 chia.daemon.getPayloadDescriptor('is_running')
{
  type: 'object',
  required: [ 'service' ],
  properties: { service: { type: 'string' } }
}
🌿 var p = chia.daemon.makePayload('is_running')
undefined
🌿 p.service = 'chia_fulll_node'
'chia_fulll_node'
🌿 await chia.daemon.is_running(p)
{ is_running: false, service_name: 'chia_fulll_node', success: true }
```

### BLS Support

```javascript
🌿 var seed = Uint8Array.from([
...   0,  50, 6,  244, 24,  199, 1,  25,  52,  88,  192,
...   19, 18, 12, 89,  6,   220, 18, 102, 58,  209, 82,
...   12, 62, 89, 110, 182, 9,   44, 20,  254, 22
... ]);
undefined
🌿 bls.AugSchemeMPL.keyGen(seed)
$38c91b9e16a98741$export$8f54525b330fd87b {
  value: 25076100791286022435148702897030204761993316905161740767284798605189048279853n
}
🌿
```

___

_chia and its logo are the registered trademark or trademark of Chia Network, Inc. in the United States and worldwide._
