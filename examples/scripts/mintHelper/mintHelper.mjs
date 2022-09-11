import { readdir, readFile } from 'fs/promises';
import path from 'path';
import mmm from 'mmmagic';
import _ from 'lodash';

export default class MintHelper {
    constructor(context) {
        if (_.isNil(context)) {
            throw Error('context cannot be nil');
        }
        if (_.isNil(context.minter)) {
            throw Error('context.minter cannot be nil');
        }
        if (_.isNil(context.metadataFactory)) {
            throw Error('context.metadataFactory cannot be nil');
        }

        this.minter = context.minter;
        this.metadataFactory = context.metadataFactory;
        this.chia = context.chia;
        this.log = context.log;
        this.magic = new mmm.Magic(mmm.MAGIC_MIME_TYPE);
    }

    async splitCoins(walletId, numberOfCoins, coinAmount = 1, txFee = 0, timeoutSeconds = 60) {
        const balance = (await this.chia.wallet.get_wallet_balance({ wallet_id: walletId })).wallet_balance;

        if (balance.unspent_coin_count >= numberOfCoins) {
            throw new Error(`This wallet already has ${balance.unspent_coin_count} coins`);
        }

        const address = (await this.chia.wallet.get_next_address({ wallet_id: walletId, new_address: false })).address;
        const payload = {
            wallet_id: walletId,
            amount: coinAmount,
            address: address,
            fee: txFee,
            min_coin_amount: 1
        };
        for (let i = 0; i < (numberOfCoins - balance.unspent_coin_count); i++) {
            const tx = await this.chia.wallet.send_transaction(payload);
            await this.waitForTransaction(tx.transaction_id, timeoutSeconds);
        }
    }

    async waitForTransaction(txid, timeoutSeconds) {
        const payload = {
            transaction_id: txid,
        };

        const timer = ms => new Promise(res => setTimeout(res, ms));
        const start = Date.now();

        let tx = await this.chia.wallet.get_transaction(payload);
        const timeoutMilliseconds = timeoutSeconds * 1000;

        // wait here until tx is confirmed
        while (tx.transaction.confirmed !== true) {
            this.log(`Waiting for transaction ${txid}`, 'debug');
            await timer(5000);
            const elapsed = Date.now() - start;
            if (elapsed > timeoutMilliseconds) {
                throw new Error('Timeout expired');
            }
            tx = await this.chia.wallet.get_transaction(payload);
        }
    }

    async mintCollectionFromFolder(walletId, targetAddress, collectionMetaData, folderPath, nftFileExt, fee = 0, royaltyAddress = targetAddress, royaltyPercentage = 0) {
        // this is a link to an Apache 2.0 pdf
        this.minter.licenseFileInfo = { type: 'application/pdf', uri: 'https://bafybeibbnjrv3nwlq6gnx3bd5l2uwozxek4sm6ad4j2gazgv3paouldvai.ipfs.nftstorage.link/license' };

        const spendBundles = [];
        const fileList = await readdir(folderPath);
        const files = fileList.filter(file => path.extname(file).toLowerCase() === nftFileExt);
        const editionTotal = files.length;

        const balance = (await this.chia.wallet.get_wallet_balance({ wallet_id: walletId })).wallet_balance;
        if (fee * files.length > balance.spendable_balance) {
            throw new Error(`Insufficnet funds: you will need ${fee * files.length} mojo to cover fees but only have ${balance.spendable_balance}.`);
        }
        if (files.length > balance.unspent_coin_count) {
            throw new Error(`Not enough coins: You will need ${files.length} coins but only have ${balance.unspent_coin_count}. Try calling the splitCoints function.`);
        }

        try {
            let editionNumber = 1;
            for (const file of files) {
                const sb = await this.mintNFT(walletId,
                    targetAddress,
                    path.join(folderPath, file),
                    collectionMetaData,
                    editionNumber,
                    editionTotal,
                    fee,
                    royaltyAddress,
                    royaltyPercentage);

                spendBundles.push(sb);
                editionNumber++;
            }

            return spendBundles;
        } catch (e) {
            this.log(e, 'error');
            if (e.message.indexOf('Can\'t select amount higher than our spendable balance') > -1) {
                this.log('Make sure your main wallet is funded and is divided into a number of small coins.', 'warning');
            }
        }

        return [];
    }

    async mintNFT(walletId, targetAddress, fullFilePath, collectionMetaData, editionNumber, editionTotal, fee, royaltyAddress, royaltyPercentage) {
        const type = await new Promise((resolve, reject) => {
            this.magic.detectFile(fullFilePath, (err, result) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(result);
                }
            });
        });

        let dataFileInfo = {
            name: path.basename(fullFilePath, path.extname(fullFilePath)),
            type: type,
            filepath: fullFilePath
        };

        let mintingInfo = {
            wallet_id: walletId,
            target_address: targetAddress,
            royalty_address: royaltyAddress,
            royalty_percentage: royaltyPercentage,
            fee: fee,
            edition_number: editionNumber,
            edition_total: editionTotal,
        };

        const metadata = await getMetadata(this.metadataFactory.createNftMetadata(dataFileInfo.name, collectionMetaData));
        this.log(`Minting ${dataFileInfo.name} (${editionNumber} of ${editionTotal})...`);
        return await this.minter.createNftFromFile(dataFileInfo, mintingInfo, metadata);
    }

    async getMetadata(nftMetadataStub, fullFilePath) {
        try {
            // this will look for a file with the same base name as the main nft file but with '.metadata.json' as an exptension
            // if present it will merge the contents of that file with the metadata stub we created above
            const metadataFileName = `${path.join(path.dirname(fullFilePath), path.basename(fullFilePath, path.extname(fullFilePath)))}.metadata.json`;

            const metadataFileContents = await readFile(metadataFileName);
            metadata = JSON.parse(metadataFileContents);

            return {
                ...nftMetadataStub,
                ...metadata
            };
        } catch {
            this.log(`No metadata file for ${fullFilePath}`, 'debug');
        }

        return nftMetadataStub;
    }
}
