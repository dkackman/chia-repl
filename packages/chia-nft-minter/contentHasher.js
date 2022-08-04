import crypto from 'crypto';
import http from 'http';
import https from 'https';
import url from 'url';
import fs from 'fs';

class ContentHasher {
    constructor(algorithm = 'sha256') {
        this._hasher = crypto.createHash(algorithm);
    }
    /**
     *
     * @param {crypto.BinaryLike} content - The content to hash
     * @returns {string}
     */
    hash(content) {
        return this._hasher
            .update(content)
            .digest('hex');
    }

    /**
     *
     * @param {string} filepath - full path to a file
     * @returns The hash of the file contents
     */
    hashFileContent(filepath) {
        const content = fs.readFileSync(filepath);
        return this.hash(content);
    }

    /**
     *
     * @param {string} uri - the Uri of a resource
     * @returns The hash of the resource
     */
    async hashUriContent(uri) {
        const content = await get(uri);
        return this.hash(content);
    }
}

const _ContentHasher = ContentHasher;
export { _ContentHasher as ContentHasher };

async function get(uri) {
    return new Promise((resolve, reject) => {
        let client = uri.toString().indexOf("https") === 0 ? https : http;

        client.get(url.parse(uri), (resp) => {
            let data = [];

            // A chunk of data has been recieved.
            resp.on('data', (chunk) => data.push(chunk));

            // The whole response has been received. Print out the result.
            resp.on('end', () => resolve(Buffer.concat(data)));
        }).on("error", (err) => {
            reject(err);
        });
    });
}
