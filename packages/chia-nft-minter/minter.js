import _ from 'lodash';

export function mint(mintInfo, mintOptions) {
    if (_.isNil(mintInfo)) {
        throw Error('mintInfo cannot be nil');
    }
    if (_.isNil(mintOptions)) {
        throw Error('mintOptions cannot be nil');
    }
}
