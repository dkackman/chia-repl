import _ from 'lodash';

export function createMintOptions(mintInfo) {
    if (_.isNil(mintInfo)) {
        throw Error('mintInfo cannot be nil');
    }

    return {
        nftImageData: '',
        nftCID: '',
        nftURL: '',
        nftArrayBuffer: '',
        nftHash: '',
        metadata: '',
        metadataCID: '',
        metadataUrl: '',
        metadataHash: '',
        command: '',
    };
}
