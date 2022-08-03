# chia-daemon

  <a href="https://www.npmjs.com/package/chia-nft-minter"><img src="https://img.shields.io/npm/v/chia-nft-minter.svg?sanitize=true" alt="Version"></a>
  <a href="https://www.npmjs.com/package/chia-nft-minter"><img src="https://img.shields.io/npm/l/chia-nft-minter.svg?sanitize=true" alt="Version"></a>
  <a href="https://www.npmjs.com/package/chia-nft-minter"><img src="https://img.shields.io/npm/dm/chia-nft-minter.svg?sanitize=true" alt="Monthly Downloads"></a>
  <a href="https://www.npmjs.com/package/chia-nft-minter"><img src="https://img.shields.io/npm/dt/chia-nft-minter.svg?sanitize=true" alt="Total Downloads"></a>

A JS client to encapsulate minting CHIA NFT's.

_Super rough ATM._

## Getting Started

```bash
npm install
npm test
```

## Basic Usage

You will need your own [nft.storage api key](https://nft.storage/docs/#get-an-api-token)

The full workflow will

- Upload a file to [nft.storage](https://nft.storage) along with metadata
- Use the resulting IPFS data to call `nft_mint_nft`

```javascript
const connection = {
    host: 'wsl',
    port: 55400,
    key_path: '~/.chia/mainnet - wsl/config/ssl/daemon/private_daemon.key',
    cert_path: '~/.chia/mainnet - wsl/config/ssl/daemon/private_daemon.crt',
    timeout_seconds: 30,
};
const chia = new ChiaDaemon(connection, 'chia-nft-minter-tests');
const connected = await chia.connect();

const fileInfo = {
    name: 'test-nft-dkackman',
    type: 'image/png',
    filepath: path.join(__dirname, 'content', 'flower.png')
};

const mintingInfo = {
    wallet_id: 1,
    royalty_address: 'txch10kn82kl6hqv47qzeh4ugmqjr5mmdcnrlymfx8wl9nrhhkyxnzfkspna7l9',
    target_address: 'txch10kn82kl6hqv47qzeh4ugmqjr5mmdcnrlymfx8wl9nrhhkyxnzfkspna7l9',
    royalty_percentage: 250,
};

const factory = new MetadataFactory('chia-nft-minter-tests');
const collectionMetaData = factory.createCollectionMetadata('test-nft-collection-dkackman', collectionAttributes);
const nftMetadata = factory.createNftMetadata('test-nft-dkackman', collectionMetaData);

const ipfsToken = fs.readFileSync("E:\\tmp\\secrets\\ipfs.test-key.txt").toString();

const result = await create_nft_from_file(chia.services.wallet, fileInfo, mintingInfo, nftMetadata, ipfsToken);

console.log(result);
```
