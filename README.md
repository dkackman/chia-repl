# chia-repl

A REPL tool for Chia and clvm_tools

## Install

```shell
cd src
npm install
```

## Run

```shell
cd src
npm start
```

## Examples

The global `options` context object has the host, port, and path to cert files. These properties can be set inside the repl with `options.host = "my-host"` etc.
Once connected to the `daemon` each of the service endpoints becomes availalbe as an awaitable context function.

Knowing [the chia rpc api](https://dkackman.github.io/chia-api/) will help immensely. All endpoints and data payloads should work. Since it is a full nodejs REPL environment, core modules like `fs` and `http` are available.

### clvm_tools

Integrates [clvm_tools-js](https://github.com/Chia-Mine/clvm_tools-js)

#### Compile a Simple Program

```lisp
> run("(mod ARGUMENT (+ ARGUMENT 3))")
'(+ 1 (q . 3))'
> brun(_, '1')
'4'
>
```

#### Compile a Simple Program From a File

```lisp
> run('../examples/factorial.clsp')
'(a (q 2 2 (c 2 (c 5 ()))) (c (q 2 (i (= 5 (q . 1)) (q 1 . 1) (q 18 5 (a 2 (c 2 (c (- 5 (q . 1)) ()))))) 1) 1))'
> brun(_, '(5)')
'120'
>
```

#### Get the Puzzle Hash and Address of a Program

```lisp
> compile('../examples/piggybank.clsp', 'tcxh', '-i../examples/include')
{
  address: 'tcxh1smq2mvt8mdmulp7q5tvwh8rn8g6u8ykfr5020a3aj3mj3hsha5ns3zea78',
  clvm: '(a (q 2 (i (> 11 5) (q 2 (i (> 11 14) (q 4 (c 10 (c 4 (c 11 ()))) (c (c 10 (c 23 (q ()))) ())) (q 4 (c 10 (c 23 (c 11 ()))) ())) 1) (q 8)) 1) (c (q 0xcafef00d 51 . 500) 1))', 
  puzzle: 'ff02ffff01ff02ffff03ffff15ff0bff0580ffff01ff02ffff03ffff15ff0bff0e80ffff01ff04ffff04ff0affff04ff04ffff04ff0bff80808080ffff04ffff04ff0affff04ff17ffff01ff80808080ff808080ffff01ff04ffff04ff0affff04ff17ffff04ff0bff80808080ff808080ff0180ffff01ff088080ff0180ffff04ffff01ff84cafef00dff338201f4ff018080',
  puzzle_hash: '86c0adb167db77cf87c0a2d8eb9c733a35c392c91d1ea7f63d947728de17ed27'
}
```

### Connecting and Calling a Node Function

```javascript
> .connect
Connecting to wss://localhost:55400...
done
> await full_node("get_network_info")
{ network_name: 'testnet10', network_prefix: 'txch', success: true }
>
```

### Chaining calls

The [special value](https://nodejs.org/api/repl.html#assignment-of-the-_-underscore-variable) `_` can be used to chain function calls.

```javascript
> await full_node("get_blockchain_state")
blockchain_state: {
  ...
}
> _.blockchain_state.peak.header_hash
'0x098b7fd5768174776eb4a29cedcabffb21c487b592c73f72ac33bc4ffecf6c38'
> await full_node("get_block", { header_hash: _ })
{
  block: {
    ...
  }
}
>
```

### Help and Options

```javascript
PS C:\Users\dkack\src\github\dkackman\chia-repl\src> npm start

> ws-client@1.0.0 start
> node index.js

> .help
.break        Sometimes you get stuck, this gets you out
.clear        Break, and also clear the local context
.connect      Opens the websocket connection to the chia daemon. Enables these awaitable functions: crawler, daemon, farmer, full_node, harvester, wallet
.disconnect   Closes the websocket connection to the chia daemon
.editor       Enter editor mode
.exit         Exit the REPL
.help         Print this help message
.load         Load JS from a file into the REPL session
.save         Save all evaluated commands in this REPL session to a file

Press Ctrl+C to abort current expression, Ctrl+D to exit the REPL
> options
{
  host: 'localhost',
  port: 55400,
  key_path: '~/.chia/mainnet/config/ssl/daemon/private_daemon.key',
  cert_path: '~/.chia/mainnet/config/ssl/daemon/private_daemon.crt',
  timeout_seconds: 30,
}
> .connect
Connecting to wss://localhost:55400...
done
> await daemon("is_running", { service: "chia_wallet" })
{ is_running: true, service_name: 'chia_wallet', success: true }
> .disconnect
Disconnecting...
done
```
