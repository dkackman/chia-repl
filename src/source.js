import { readFileSync, existsSync } from 'fs';

export function getSource(src) {
    // if it's a file path read and return it
    if (existsSync(src)) {
        return readFileSync(src);
    }

    // everything else is source
    return src;
}
