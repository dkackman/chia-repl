import chai from 'chai';
import { MessageQueue } from 'chia-bot';

const expect = chai.expect;

describe('chia-bot', () => {
    describe('MessageQueue', () => {
        it('should throw when services arent provided', function () {
            let q;
            expect(() => q = new MessageQueue()).to.throw();
        });
    });
});
