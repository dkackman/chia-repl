// adapted from https://github.com/Chia-Network/chia-blockchain-gui
import os from 'os';

const homeDirectory = os.homedir();

/**
 * Resolves paths like ~/.chia/mainnet to their fully qualified equivalent in a platform safe manner.
 * @param {string} pathWithTilde - A path that may or may not be rooted in the user's home folder.
 * @returns Fully quialified path, i.e. /home/user/.chia instead of ~/.chia.
 */
export default function untildify(pathWithTilde) {
    if (typeof pathWithTilde !== 'string') {
        throw new Error(`Expected a string, got ${typeof pathWithTilde}`);
    }

    return homeDirectory ? pathWithTilde.replace(/^~(?=$|\/|\\)/, homeDirectory)
        : pathWithTilde;
}
