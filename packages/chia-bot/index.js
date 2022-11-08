import MessageQueue from './message_queue.js';
import { ChiaDaemon } from 'chia-daemon';

export {
    MessageQueue,
};

const connection = {
    host: 'chiapas',
    port: 55400,
    key_path: '~/.chia/mainnet - chiapas/config/ssl/daemon/private_daemon.key',
    cert_path: '~/.chia/mainnet - chiapas/config/ssl/daemon/private_daemon.crt',
    timeout_seconds: 10,
};

const chia = new ChiaDaemon(connection, 'tests');
const connected = await chia.connect();
if (connected) {
    console.log('connected');
    const q = new MessageQueue(chia.services.wallet, chia.services.full_node, 'txch');
    const listener = async (message) => {
        console.log(message);
        await q.deleteMessages([message]);
    };
    q.on('message-received', listener);
    await q.listen();
}
