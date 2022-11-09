import MessageQueue from './message_queue.js';
import { ChiaDaemon } from 'chia-daemon';
import fing from './fing.js';
import upload from './upload.js';
import mint from './mint.js';
import offer from './offer.js';
import { sendOfferTo } from './offer_message.js';

export {
    MessageQueue,
};


const config = {
    daemon_host: 'chiapas',
    creator_did: 'did:chia:1w4tuxuw622qncpqlwl5j4s62zm9ju5dvgyjl0q7fvqtfnmwjffmqwfkqjg',
    nft_storage_key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkaWQ6ZXRocjoweDM2ZEREQUJEN0ExRjhhM2UzNDkzMzA3ZjRhQzcxRTVCQ2QwRGI4QTkiLCJpc3MiOiJuZnQtc3RvcmFnZSIsImlhdCI6MTY1OTQ3ODIwMjAxMCwibmFtZSI6InRlc3Qta2V5In0.3CTuPgBWEO2vLB8kX9FD7OLvC2gtqz-Wn5o8D9q5xIs',
    coin_prefix: 'txch',

    /*
    daemon_host: 'former',
    creator_did: 'did:chia:1dd4ddprvxdqahkmz0lxxe5rf6k82c94nuced8qfd39df6rua8y2qa2tnyu',
    nft_storage_key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkaWQ6ZXRocjoweDM2ZEREQUJEN0ExRjhhM2UzNDkzMzA3ZjRhQzcxRTVCQ2QwRGI4QTkiLCJpc3MiOiJuZnQtc3RvcmFnZSIsImlhdCI6MTY2NDY1OTUwMTQ4NSwibmFtZSI6Im5mdHMtcHJvZCJ9.Ny6L4DPzjd0BUrVkWEV1rlg28dKs2ljJPNi_O9rSvhI',
    coin_prefix: 'xch',
    */

    fing_uri: 'http://cuddly:9147',
    fing_x_api_key: 'e4a80047-bc50-4d14-ba7b-8e008c2b557a',
    license_uri: 'https://raw.githubusercontent.com/CompVis/stable-diffusion/main/LICENSE',
    chia_version: '1.6.1',
    minting_fee: 1000,
};

const connection = {
    host: config.daemon_host,
    port: 55400,
    key_path: `~/.chia/mainnet - ${config.daemon_host}/config/ssl/daemon/private_daemon.key`,
    cert_path: `~/.chia/mainnet - ${config.daemon_host}/config/ssl/daemon/private_daemon.crt`,
    timeout_seconds: 10,
};

const chia = new ChiaDaemon(connection, 'tests');
/* jshint ignore: start */
if (await chia.connect()) {
    console.log('connected');
    const q = new MessageQueue(chia.services.wallet, chia.services.full_node, config.coin_prefix);
    const listener = async (message) => {
        await generateAndSendOffer(message);
        await q.deleteMessages([message]);
    };
    q.on('message-received', listener);
    await q.listen(1, 1000);
}
/* jshint ignore: end */

let seriesNumber = 21;

async function generateAndSendOffer(message) {
    const task = {
        prompt: message.text,
        seriesNumber: 21,
        seriesTotal: 10000,
        target_address: message.senderAddress,
        royalty_address: 'txch1davrpa709alhp3n3g4wjnfwe8jc9cx0pfht2a7wxlpg3cqfukv0s9r4jss',
        royalty_percentage: 300,
        collection: {
            name: 'Stable-diffusion for the masses',
            id: '2a8711bc-98ab-4c75-838e-57c93debbeb9',
            attributes: [
                {
                    type: 'description',
                    value: 'Collection of stable-diffusion generated pictures',
                },
                {
                    type: 'twitter',
                    value: '@dkackman',
                },
                {
                    type: 'website',
                    value: 'https://kackman.net',
                }
            ]
        }
    };

    const blob = await fing(config, task);
    const ipfs = await upload(config, task, blob);
    const launcher = await mint(chia.services.wallet, chia.services.full_node, config, task, ipfs);
    const theOffer = await offer(chia.services.wallet, launcher);
    const tx = await sendOfferTo(chia.services.wallet, message.senderAddress, theOffer.offer);

    console.log(tx);
}
