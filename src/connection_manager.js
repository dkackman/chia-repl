import { Chia } from './chia.js';
import * as context_manager from './context_manager.js';

export function connect(replServer) {
    const address = `wss://${replServer.context.connection.host}:${replServer.context.connection.port}`;
    console.log(`Connecting to ${address}...`);
    const chiaServer = new Chia(replServer.context.connection);
    chiaServer.connect((msg) => {
        console.log(msg);
        replServer.displayPrompt();
    },
    (e) => {
        context_manager.clearContext(replServer);
        console.log(e);
        replServer.displayPrompt();
    });
    replServer.context.chiaServer = chiaServer;
    replServer.context.chia = chiaServer.endpoints;
}

export function disconnect(replServer) {
    if (replServer.context.chiaServer !== undefined) {
        replServer.context.chiaServer.disconnect();
        context_manager.clearContext(replServer);
    }
}
