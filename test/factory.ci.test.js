import chai from 'chai';
import createRepl from '../src/repl_factory.js';

const expect = chai.expect;

describe('repl-factory', () => {
    describe('createRepl', () => {
        it('should create an object instance of type ChiaRepl', () => {
            const repl = createRepl();
            expect(repl).to.not.equal(null);
            expect(repl).to.not.equal(undefined);
            expect(repl.constructor.name).to.equal('ChiaRepl');
        });
    });
});
