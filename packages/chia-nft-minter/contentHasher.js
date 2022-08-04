import crypto from 'crypto';
import http from 'http';
import https from 'https';
import url from 'url';
import fs from 'fs';
//
// Adapted from https://github.com/mintgarden-io/mintgarden-studio/blob/main/src/helpers/nft-storage.ts
//
/**
 *
 * @param {crypto.BinaryLike} content - The content to hash
 * @returns {string}
 */
export function hash(content) {
    return crypto
        .createHash('sha256')
        .update(content)
        .digest('hex');
}

export function hashFileContent(filepath) {
    const content = fs.readFileSync(filepath);
    return hash(content);
}

export async function hashUriContent(uri) {
    const content = await get(uri);
    return hash(content);
}

async function get(uri) {
    return new Promise((resolve, reject) => {
        let client = (uri.toString().indexOf("https") === 0) ? https : http;

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
