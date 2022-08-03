import chai from 'chai';
import { getSetting } from '../chia-repl/settings.js';

const expect = chai.expect;

describe('repl-factory', () => {
    describe('settings', () => {
        it('should merge unpopulated defaults into saved settings', () => {
            const defaults = {
                host: 'localhost',
                port: 55400,
                key_path: '~/.chia/mainnet/config/ssl/daemon/private_daemon.key',
                cert_path: '~/.chia/mainnet/config/ssl/daemon/private_daemon.crt',
                timeout_seconds: 30,
                ipfsToken: '_NEW_'
            };

            const saved = {
                host: 'localhost',
                port: 55400,
                key_path: '~/.chia/mainnet/config/ssl/daemon/private_daemon.key',
                cert_path: '~/.chia/mainnet/config/ssl/daemon/private_daemon.crt',
                timeout_seconds: 30,
            };

            const merged = {
                ...defaults,
                ...saved,
            };

            expect(merged.ipfsToken).to.equal(defaults.ipfsToken);
        });
        it('should not overwrite populated defaults _DEBUG_', () => {
            const defaults = {
                host: 'localhost',
                port: 55400,
                key_path: '~/.chia/mainnet/config/ssl/daemon/private_daemon.key',
                cert_path: '~/.chia/mainnet/config/ssl/daemon/private_daemon.crt',
                timeout_seconds: 30
            };

            const saved = {
                host: 'localhost',
                port: 55400,
                key_path: '_DO_NOT_MERGE_',
                cert_path: '~/.chia/mainnet/config/ssl/daemon/private_daemon.crt',
                timeout_seconds: 30,
            };

            const merged = {
                ...defaults,
                ...saved,
            };

            expect(merged.key_path).to.equal(saved.key_path);
        });
    });
});
