import _ from 'lodash';
import { v4 as uuidv4 } from 'uuid';

export const NFT_FORMAT = 'CHIP-0007';

class MetadataFactory {
    constructor(minting_tool = 'chia-repl') {
        this.minting_tool = minting_tool;
    }

    createCollectionMetadata(name, attributes = []) {
        if (_.isNil(name)) {
            throw Error('name cannot be nil');
        }
        return {
            name: name,
            id: uuidv4(),
            attributes: attributes
        };
    }

    createNftMetadata(name, collection, attributes = [], description = '', sensitive_content = false) {
        if (_.isNil(name)) {
            throw Error('name cannot be nil');
        }
        if (_.isNil(collection)) {
            throw Error('collection cannot be nil');
        }
        return {
            format: NFT_FORMAT,
            name: name,
            description: description,
            minting_tool: this.minting_tool,
            sensitive_content: sensitive_content,
            attributes: attributes,
            collection: collection
        };
    }

    createAttributeArray(nameValuePairList) {
        if (!_.isArrayLike(nameValuePairList)) {
            throw Error('nameValuePairList is not an array');
        }

        return _.map(nameValuePairList, (item) => {
            return {
                type: item[0],
                value: item[1]
            };
        });
    }

    addAttribute(attributeArray, type, value) {
        if (_.isNil(attributeArray)) {
            throw Error('attributeArray cannot be nil');
        }
        if (!_.isArray(attributeArray)) {
            throw Error('attributeArray is not an array');
        }
        if (_.isNil(type)) {
            throw Error('type cannot be nil');
        }
        attributeArray.push({
            type: type,
            value: value
        });
    }
}

const _MetadataFactory = MetadataFactory;
export { _MetadataFactory as MetadataFactory };
