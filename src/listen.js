import keypress from 'keypress';

export default async function listener(chia) {
    keypress(process.stdin);
    let anykey = false;
    process.stdin.once('keypress', () => anykey = true);

    const event_callback = m => console.log(m);
    chia.on('event-message', event_callback);

    const timer = ms => new Promise(res => setTimeout(res, ms));

    console.log('Listening...');
    console.log('Press any key to stop');

    //stay here until we receive an event or timeout
    while (!anykey) {
        await timer(100);
    }

    chia.removeListener('event-message', event_callback);
    process.stdin.setRawMode(true);
    process.stdin.resume();
}
