# chia-repl

A REPL tool for Chia

## install

```shell
cd src
npm install
```

## run

```shell
cd src
npm start
.help
```

## example

The global `options` context object has the host, port and path to cert files. These properties can be set inside the repl with `options.host = "my-host"`

```shell
PS C:\Users\dkack\src\github\dkackman\chia-repl\src> npm start
Debugger attached.

> ws-client@1.0.0 start C:\Users\dkack\src\github\dkackman\chia-repl\src
> node index.js

Debugger attached.
> .help
.break        Sometimes you get stuck, this gets you out
.clear        Break, and also clear the local context
.connect      Opens the websocket connection to the chia daemon
.daemon       Sends a command to the chia daemon
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
  cert_path: '~/.chia/mainnet/config/ssl/daemon/private_daemon.crt'
}
> .connect
Connecting...
{
  "ack": true,
  "command": "register_service",
  "data": {
    "success": true
  },
  "destination": "chia_repl",
  "origin": "daemon",
  "request_id": "293579bcedd5ab377bbd9a514fcd2012af6d2b2c4c17ee6f563018cfb43b3be9"
}
> .daemon is_keyring_locked
{
  "ack": true,
  "command": "is_keyring_locked",
  "data": {
    "is_keyring_locked": false,
    "success": true
  },
  "destination": "chia_repl",
  "origin": "daemon",
  "request_id": "bc797093c3cf89d2456e3b3e3f68f8c9f2ead4c85e9aca53624aa3f3c6423154"
}
> .disconnect
Disconnected...
>
```
