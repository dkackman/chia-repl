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

> ws-client@1.0.0 start
> node index.js

> .help
.break        Sometimes you get stuck, this gets you out
.clear        Break, and also clear the local context
.connect      Opens the websocket connection to the chia daemon
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
Connecting to wss://localhost:55400...
done
> await daemon("is_running", { service: "wallet" })
{ is_running: false, service_name: 'wallet', success: true }
> .disconnect
Disconnecting...
done
```
