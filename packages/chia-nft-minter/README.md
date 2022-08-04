# chia-daemon

  <a href="https://www.npmjs.com/package/chia-nft-minter"><img src="https://img.shields.io/npm/v/chia-nft-minter.svg?sanitize=true" alt="Version"></a>
  <a href="https://www.npmjs.com/package/chia-nft-minter"><img src="https://img.shields.io/npm/l/chia-nft-minter.svg?sanitize=true" alt="Version"></a>
  <a href="https://www.npmjs.com/package/chia-nft-minter"><img src="https://img.shields.io/npm/dm/chia-nft-minter.svg?sanitize=true" alt="Monthly Downloads"></a>
  <a href="https://www.npmjs.com/package/chia-nft-minter"><img src="https://img.shields.io/npm/dt/chia-nft-minter.svg?sanitize=true" alt="Total Downloads"></a>

A JS client to encapsulate minting CHIA NFT's.

_Super rough ATM._

Heavily informed by [mintgarden](https://github.com/mintgarden-io/mintgarden-studio)

## Getting Started

```bash
npm install
npm test
```

## Basic Usage

You will need

- Your own [nft.storage api key](https://nft.storage/docs/#get-an-api-token)
- A valid chia node and its connection details
- Patience because this thing just kinda works right now

The full workflow will

- Generate metadata for the NFT
- Upload a file to [nft.storage](https://nft.storage) along with metadata
- Supply information about the minting process
- Use the minting information and IPFS data to call `nft_mint_nft`

```javascript
import { ChiaDaemon, loadUIConfig } from 'chia-daemon';
import { NftMinter, MetadataFactory } from 'chia-nft-minter';

const dataFileInfo = {
    name: 'test-nft-by-you',
    type: 'image/png',
    filepath: 'C:\\path\\to\\some_file.png'
};

const mintingInfo = {
    wallet_id: 2,
    royalty_address: 'txch10kn82kl6hqv47qzeh4ugmqjr5mmdcnrlymfx8wl9nrhhkyxnzfkspna7l9',
    target_address: 'txch10kn82kl6hqv47qzeh4ugmqjr5mmdcnrlymfx8wl9nrhhkyxnzfkspna7l9',
    royalty_percentage: 250,
};

const factory = new MetadataFactory('chia-nft-minter-tests');
const collectionMetaData = factory.createCollectionMetadata('test-nft-collection-by-you');
const nftMetadata = factory.createNftMetadata('test-nft-by-you', collectionMetaData);

const daemon = new ChiaDaemon(loadUIConfig(), 'your-chia-nft-app');
const connected = await chia.connect();

const minter = new NftMinter(chia.services.wallet, '_YOUR_API_KEY_');
const result = await minter.createNftFromFile(dataFileInfo, mintingInfo, nftMetadata);

console.log(result);
```
