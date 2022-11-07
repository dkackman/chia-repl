import { MessageQueue } from "chia-daemon";

let q = new MessageQueue(chia.wallet);
let listener = async (message) => {
    console.log(message);
    await q.deleteMessages([message]);
};
q.on('message-received', listener);
await q.listen();
