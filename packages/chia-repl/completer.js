import { readFileSync } from 'fs';
import _ from 'lodash';
import { __dirname } from './settings.js';
import path from 'path';

// this module does tab completions for the chia service endpoints. When
// it looks like the user is using the chia endpoints it will lookup matching
// completions. Otherwise it defers to the builtin in tab completer

const completions = ['chia.crawler', 'chia.daemon', 'chia.farmer', 'chia.full_node', 'chia.harvester', 'chia.wallet'];
loadCompletions(__dirname);

// wrap the regular completer in a proxy so we can synthesize completions
export default function createCompleterProxy(completer) {
    return new Proxy(completer, handler);
}

const handler = {
    apply: function (target, thisArg, argumentsList) {
        if (_.get(thisArg, 'context.chia') !== undefined) {
            const line = argumentsList[0].replace('await', '').trimStart();
            const hits = completions.filter((c) => c.indexOf(line) == 0);

            if (hits.length > 0) {
                // in here we do custom completion to get rpc endpoints and their functions
                argumentsList[1](false, [hits, line]);
                return; // exit so we don't call the default completer
            }
        }
        // if we get here - no custom completions, defer to default implementation
        target(...argumentsList);
    }
};

function loadCompletions(rootDir) {
    try {
        const data = readFileSync(path.join(rootDir, 'resources/completions.json'), 'utf8');
        const c = JSON.parse(data);

        completions.push(...c);
    }
    catch (err) {
        console.debug(err);
    }
}
