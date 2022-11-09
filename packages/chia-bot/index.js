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
    const tx = sendOfferTo(chia.services.wallet, message.senderAddress, theOffer.offer);

    console.log(tx);

}

/*
const theOffer = {
    offer: "offer1qqph3wlykhv8jcmqvpsxygqqwc7hynr6hum6e0mnf72sn7uvvkpt68eyumkhelprk0adeg42nlelk2mpafsyjlm5pqpj3d4ql88gej89pnhhxf7wm3mykc5ekrug9nf0960277da2em5d88rq7dsgndqj26qjngnfuvhxdz08akvwlzk5hlavhl40anxv2v0hqvejy4ctpk6t8lada38uqdky097fcf33drzt00mhvl9s6pld7l3qxtcwmpulxg9dl9nu986fa0dzvwfmlqjsjkga9r88gl44583vlmld9jsgu6unxwn9ewjcaf4k7qrxclknqjxzq3mcuq6r40yzt5vg6r4w35827rdauq2y3kjl2zlv52tellwc5rlwnnnkfkm4ylyhmau37vylcyfxkr340dujtak6nx0l0lqse4kemlhf26n20uttcat42aljfaauvn3aem6hmkn4edn6wklke7zckhslep6nyn8grpgrdr0l9rxkr3d47emy2aw8t2m6mkfc4jhuj7wr6696zd4p2ulqxqa6js56qscrh2pn05r8tsqf0mqs8hleupjl7gz2aswqmaha7ekxrjmtv624edfvm9ja6rczlev70jy8vru28a07szzgey5jsd3jkl8uhj6f9c5jlj3vfa25hjwve0tvlnxg9dtzljjvfdx25n2v6fgj6t6heghag2f5fghjmnz29g4nf2f5xyknxnff9dxv7t2f9jh54nxneg5ul5429u5v7jfd9j5t2v3w9t2905pjxs4u4jpltlsxh3q5wqrv5xpxzsqwvck033ku6t62j5l0uanlszv78vxemul0acgwnylaarkws945twfk0zh2ras97gqhazertxhe95mt2ff3yjcj25fw4vunlml7sqqzh7gwc3y6ztupnhflup7uvqlzsjed6a9v7txf9pxj5t2w939ulnetf8xjh5ztel8aga70ecks3j3d6chjujzdedya2nxff49j5tx0eh8a8njvehxa8ahsw4mlgzmhqkv908q8av33f95qerwccp2mnwhnawwzhh4dz8vhrxu08rznyf2h82lzrlwfju6dvmzq545hug2rwgqkvskaseetk6hw4q04mrwccmvk4thled8cdxm0mr4aj7k6a9w2ahqc4xs9mmpa8k4l9ahnla2y3an0nkcl8umrd28t775n9wah43wnes88hn6uhevcj7hhwc3fm4rcw8zs7tcwnv8zaxcjxq8hl50pca3yx607svhdpy504r400a2tjlc5sf6gn7laqsnu7w5ae2m03kerthch8u4q593mkn8h6n22pj6tcv8pdhs2dw6kryf00758tkz2aj69acgmgl27lnfxztzx004au32cdfyfrswa7xsamcds8sn66zu6xhe8wpq8lpwp7melhagycu946ce5jm0mfkg3ytuapakmhw0vvlsyegcd5mvksu5x5c74qyuqamjqkkkr2mqkmkpqehesajh4lsda9jhx2wjjm6edmwmu29u7tp0576h5dle6yhfh97we635662q7hll8kvl0tu5dknqf5eks76854jc48vcqjhayuwxhlch2svvf9tuw70ps00nhang8ka55hzet56l060mrt3dculcaldyg0c3xsasedqzxerqqupekmeqqeuwqugp59c47jp7qpmrgzd2qjv5err3llkl7tasvxc2kn05l2j2nmmna8se4ldnskfyuhv48zgu0ufsldnydr0cuflk7cwew53wkld89kschwe4kw8y7ceccf70juxsawznldsu0aex7a7smlh69mxm27786vrru8ehhlc0dk7tethmmfk9kdn9g802drd6jwz0auaam09rl6waz256upc0y70lza3g34g0eedh93va2dhu4fe8d9mfher74uu553hrkqzu3cm4yj0khu7"
};
*/
