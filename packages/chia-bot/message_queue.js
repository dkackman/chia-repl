import _ from 'lodash';
import { EventEmitter } from 'events';
import _utils from 'chia-utils';

/*
    wraps the on chain notifications into a message queue
*/
export default class MessageQueue extends EventEmitter {
    constructor(wallet, fullNode, networkPrefix = 'xch') {
        super();
        if (_.isNil(wallet)) {
            throw new Error('wallet must be provided');
        }
        if (_.isNil(fullNode)) {
            throw new Error('fullNode must be provided');
        }

        this.wallet = wallet;
        this.fullNode = fullNode;
        this.networkPrefix = networkPrefix;
    }

    /*
        Peeks at the next `count` messages on the queue. does not remove them
    */
    async peekMessages(count = 1) {
        const payload = {
            start: 0,
            end: count,
        };
        const getResponse = await this.wallet.get_notifications(payload);
        return getResponse.notifications ?? [];
    }

    /*
        takes the next `count` messages and removes them from the queue
    */
    async popMessages(count = 1) {
        const messages = await this.peekMessages(count);
        await this.deleteMessages(messages);
        return messages;
    }

    /*
        deletes all of the supplied messages
    */
    async deleteMessages(messages = []) {
        if (!_.isArray(messages)) {
            throw new Error('messages must be an array');
        }
        const ids = _.map(messages, message => message.id);
        if (!_.isEmpty(ids)) {
            await this.wallet.delete_notifications({ ids: ids });
        }
    }

    /*
        interupts any running listen loop
    */
    stop() {
        console.log('stopping');
        this._stop = true;
    }

    /*
        polls the queue every `pollSeconds`, raising a `message-received` event
        for each message. Will continue to notify on individual messages
        until they are deleted, which should be done by the listener
    */
    async listen(messageCount = 1, pollSeconds = 60) {
        this._stop = false;

        const timer = ms => new Promise(res => setTimeout(res, ms));
        while (this._stop !== true) {
            const messages = await this.peekMessages(messageCount);
            for await (const message of messages) {
                const detail = await this.getNotificationDetail(message.id);
                message.text = Buffer.from(message.message, "hex").toString("utf8");
                message.senderAddress = detail.senderAddress;
                message.timestamp = detail.timestamp;

                this.emit('message-received', message);
            };

            await timer(pollSeconds * 1000);
        }
    }

    async getNotificationDetail(messageId) {
        const coinResponse = await this.fullNode.get_coin_record_by_name({ name: messageId });
        const parentCoinId = coinResponse.coin_record.coin.parent_coin_info;
        const parentCointResponse = await this.fullNode.get_coin_record_by_name({ name: parentCoinId });
        return {
            senderAddress: _utils.puzzle_hash_to_address(parentCointResponse.coin_record.coin.puzzle_hash, this.networkPrefix),
            timestamp: new Date(parentCointResponse.coin_record.timestamp * 1000).toISOString(),
        };
    }
}
