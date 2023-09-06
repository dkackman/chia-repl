# chia-daemon

  <a href="https://www.npmjs.com/package/chia-daemon"><img src="https://img.shields.io/npm/v/chia-daemon.svg?sanitize=true" alt="Version"></a>
  <a href="https://www.npmjs.com/package/chia-daemon"><img src="https://img.shields.io/npm/l/chia-daemon.svg?sanitize=true" alt="Version"></a>
  <a href="https://www.npmjs.com/package/chia-daemon"><img src="https://img.shields.io/npm/dm/chia-daemon.svg?sanitize=true" alt="Monthly Downloads"></a>
  <a href="https://www.npmjs.com/package/chia-daemon"><img src="https://img.shields.io/npm/dt/chia-daemon.svg?sanitize=true" alt="Total Downloads"></a>

A JS client for chia daemon and https services with dynamically generated end points

## Getting Started

```bash
npm install
npm test
```

## Documentation

<https://dkackman.github.io/chia-daemon/>

## Basic Usage

Each service is a field on the `services` property of the `ChiaDaemon`.

- Since all service calls go through the daemon there is no need for other endpoint configuration
- All RPC calls are async
- Since all rpc call are dynamically invoked there is no need to update the library with new Chia releases.
(i.e. if you invoke `daemon.wallet.foo()` it will call make an RPC to a function named `foo` at that endpoint and error if it doesn't exist there)

```javascript
import { ChiaDaemon, loadUIConfig } from 'chia-daemon';

const daemon = new ChiaDaemon(loadUIConfig(), 'my-chia-app');
const connected = await daemon.connect();
if (connected) {
    const state = await daemon.services.full_node.get_blockchain_state();
    console.log(state);
}
```

Also supports `https` connections:

```javascript
import { createHttpsService, createConnection } from "chia-daemon";

const connection = createConnection(
    "wallet",
    "localhost",
);
const wallet = createHttpsService(connection);
const response = await wallet.get_wallets({ include_data: true });

console.log(`You have ${response.wallets.length} wallets`);
```

## Payload Helpers

Includes helper functions to get request payloads right:

### Get the OpenAPI responseBody Schema Descriptor

```javascript
console.log(daemon.services.full_node.getPayloadDescriptor('open_connection'));

{
  type: 'object',
  required: [ 'ip', 'port' ],
  properties: {
    ip: { type: 'string', format: 'ipaddress' },
    port: { type: 'integer' }
  }
}
```

### Get a Payload Object Instance

```javascript
const connection = daemon.services.full_node.makePayload('open_connection');
console.log(connection);

{ ip: '', port: 0 }

connection.ip = 'chia.net';
connection.port = 4444;

await daemon.services.full_node.open_connection(connection);
```
