import { readFileSync } from 'fs';
import _ from 'lodash';

// wrap the regular completer in a proxy so we can synthesize completions
export function createCompleterProxy(completer) {
    return new Proxy(completer, handler);
}

const handler = {
    apply: function (target, thisArg, argumentsList) {
        if (_.get(thisArg, 'context.chia') !== undefined) {
            const line = argumentsList[0].replace('await ', '');
            const hits = completions.filter(function (c) { return c.indexOf(line) == 0; });

            if (hits.length > 0) { 
                // in here we do custom completion to get rpc endpoints and their functions
                argumentsList[1](false, [hits, line]);
                return; // exit so we don't call the default completer
            }
        }
        target(...argumentsList);
    }
};

export function loadCompletions() {
    const data = readFileSync('./completions.json', 'utf8');

    const c = JSON.parse(data);
    completions.push(...c);
}

const completions = ['chia.crawler', 'chia.daemon', 'chia.farmer', 'chia.full_node', 'chia.harvester', 'chia.wallet'];