import _ from 'lodash';
import { EventEmitter } from 'events';

/*
    wraps the on chain notifications into a message queue
*/
export default class MessageQueue extends EventEmitter {
    constructor(wallet) {
        super();
        if (_.isNil(wallet)) {
            throw new Error('wallet must be provided');
        }

        this.wallet = wallet;
    }

    /*
        Peeks the next count messages from the queue. does not remove them
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
        this.stop = true;
    }

    /*
        polls the queue periodically, raising `message-received` event
        for each message. Will continue to notify on individual messages
        until they are deleted
    */
    async listen(messageCount = 1, pollSeconds = 10) {
        this.stop = false;

        const timer = ms => new Promise(res => setTimeout(res, ms));
        while (this.stop !== true) {
            const messages = await this.peekMessages(messageCount);
            messages.forEach(message => this.emit('message-received', message));

            await timer(pollSeconds * 1000);
        }
    }
}
