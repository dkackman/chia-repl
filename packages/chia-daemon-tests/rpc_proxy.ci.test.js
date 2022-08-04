/* eslint-disable no-prototype-builtins */
import chai from 'chai';
import { createRpcProxy } from 'chia-daemon';

const expect = chai.expect;

describe('rpc-proxy', () => {
    describe('invocation', () => {
        it('should forward Object function calls to base object', () => {
            const proxy = createRpcProxy(null, '');
            const str = proxy.toString();

            expect(str).to.equal('[object Object]');
        });
        it('should forward makePayload function call', () => {
            const proxy = createRpcProxy(null, 'crawler');
            const payload = proxy.makePayload('open_connection');

            expect(payload).to.not.equal(null);
            expect(payload).to.not.equal(undefined);
            expect(payload.hasOwnProperty('ip')).to.equal(true);
            expect(payload.hasOwnProperty('port')).to.equal(true);
            expect(typeof payload.ip).to.equal('string');
            expect(typeof payload.port).to.equal('number');
        });
        it('should forward getPayloadDescriptor function call', () => {
            const proxy = createRpcProxy(null, 'crawler');
            const descriptor = proxy.getPayloadDescriptor('open_connection');

            expect(descriptor).to.not.equal(null);
            expect(descriptor).to.not.equal(undefined);
        });
        it('should forward all other function calls to sendCommand', async () => {
            let resulting_endpoint = '';
            let resulting_functionName = '';

            const fakeChia = {
                sendCommand: (endpoint, functionName, data) => {
                    resulting_endpoint = endpoint;
                    resulting_functionName = functionName;
                }
            };

            const proxy = createRpcProxy(fakeChia, 'TEST_ENDPOINT');
            await proxy.TEST_FUNCTION();

            expect(resulting_endpoint).to.equal('TEST_ENDPOINT');
            expect(resulting_functionName).to.equal('TEST_FUNCTION');
        });
    });
});
