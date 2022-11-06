import _ from 'lodash';
import { EventEmitter } from 'events';

export default class MessageQueue extends EventEmitter {
    constructor(wallet) {
        super();
        if (_.isNil(wallet)) {
            throw new Error('wallet must be provided');
        }

        this.wallet = wallet;
    }

    async peekMessages(count = 1) {
        const payload = {
            start: 0,
            end: count,
        };
        const getResponse = await this.wallet.get_notifications(payload);
        return getResponse.notifications;
    }

    async popMessages(count = 1) {
        const messages = await this.peekMessages(count);
        await this.deleteMessages(messages);
        return messages;
    }

    async deleteMessages(messages) {
        const ids = _.map(messages, message => message.id);
        await this.wallet.delete_notifications(ids);
    }

    stop() {
        this.stop = true;
    }

    async listen(pollSeconds = 10) {
        const timer = ms => new Promise(res => setTimeout(res, ms));
        while (this.stop !== true) {
            const messages = await this.peekMessages(1);
            messages.forEach(message => this.emit('message-received', message));
            await timer(pollSeconds * 1000);
        }
    }
}
