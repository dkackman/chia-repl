# chia-repl

A REPL tool for Chia

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

Knowing [the chia rpc api](https://dkackman.github.io/chia-api/) will help immensely. All endpoints and data payloads should work.

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
