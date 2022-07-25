/* eslint-disable no-prototype-builtins */
import chai from 'chai';

import { getPayloadDescriptor, makePayload } from '../chia-daemon//payload_generator.js';

const expect = chai.expect;

describe('payload-generator', () => {
    describe('generator', () => {
        it('should make simple object from request schema', () => {
            const payload = makePayload('crawler', 'open_connection');
            expect(payload).to.not.equal(null);
            expect(payload).to.not.equal(undefined);
            expect(payload.hasOwnProperty('ip')).to.equal(true);
            expect(payload.hasOwnProperty('port')).to.equal(true);
            expect(typeof payload.ip).to.equal('string');
            expect(typeof payload.port).to.equal('number');
        });
        it('should make a payload from a schema that includes `allof` _DEBUG_', () => {
            const payload = makePayload('full_node', 'get_coin_records_by_parent_ids', false);
            expect(payload).to.not.equal(null);
            expect(payload).to.not.equal(undefined);
            expect(payload.hasOwnProperty('parent_ids')).to.equal(true);
            expect(payload.hasOwnProperty('start_height')).to.equal(true);
            expect(payload.hasOwnProperty('end_height')).to.equal(true);
            expect(payload.hasOwnProperty('include_spent_coins')).to.equal(true);

        });
        it('should respect default values', () => {
            const payload = makePayload('crawler', 'get_ips_after_timestamp', false);
            expect(payload).to.not.equal(null);
            expect(payload).to.not.equal(undefined);
            expect(payload.hasOwnProperty('limit')).to.equal(true);
            expect(payload.limit).to.equal(10000);
        });
        it('should handle array properties', () => {
            const payload = makePayload('farmer', 'get_harvester_plots_valid', false);
            expect(payload).to.not.equal(null);
            expect(payload).to.not.equal(undefined);
            expect(payload.hasOwnProperty('filter')).to.equal(true);
            expect(Array.isArray(payload.filter)).to.equal(true);
        });
        it('should return undefined when no payload is required', () => {
            const payload = makePayload('crawler', 'healthz');
            expect(payload).to.equal(undefined);
        });
        it('should only return required fields by default', () => {
            const payload = makePayload('daemon', 'start_plotting');
            expect(payload.hasOwnProperty('delay')).to.not.equal(true);
        });
        it('should return optional fields when asked for', () => {
            const payload = makePayload('wallet', 'cancel_offer', false);
            expect(payload.hasOwnProperty('trade_id')).to.equal(true);
            expect(payload.hasOwnProperty('secure')).to.equal(true);
            expect(payload.hasOwnProperty('fee')).to.equal(true);
        });
    });
    describe('descriptor', () => {
        it('should retreive request body schema', () => {
            const descriptor = getPayloadDescriptor('farmer', 'get_harvester_plots_duplicates');
            expect(descriptor).to.not.equal(null);
            expect(descriptor).to.not.equal(undefined);
        });
    });
});
