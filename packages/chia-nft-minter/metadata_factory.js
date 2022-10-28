import _ from 'lodash';
import { v4 as uuidv4 } from 'uuid';

export const NFT_FORMAT = 'CHIP-0007';

export default class MetadataFactory {
    constructor(minting_tool = 'chia-repl') {
        this.minting_tool = minting_tool;
    }

    /**
     *
     * @param {string}  - The collection name
     * @param {[]} attributes - [[string, string]] or [{ type: 'string', value: 'string' }]
     * @returns Collection object
     */
    createCollectionMetadata(name, attributes = []) {
        if (_.isNil(name)) {
            throw Error('name cannot be nil');
        }
        if (!_.isArrayLike(attributes)) {
            throw Error('attributes is not an array');
        }

        // attributes can be of two shapes
        // 1 - an array of name value pairs - [[string, string]]
        // 2 - the output of create attribute array [{ type: 'string', value: 'string' }]
        const atttributeList = attributes.length > 0 && _.isArrayLike(attributes[0]) ?
            this.createAttributeArray(attributes, 'type') :
            attributes;

        return {
            name: name,
            id: uuidv4(),
            attributes: atttributeList
        };
    }

    /**
     *
     * @param {string} name - The NFT name
     * @param {Object} collection - The NFT collection
     * @param {[]} attributes - [[string, string]] or [{ trait_type: 'string', value: 'string' }]
     * @param {string} description - The NFT description
     * @param {boolean} sensitive_content - Flag for sensitive content
     * @returns NFT metadata obect
     */
    createNftMetadata(name, collection, attributes = [], description = '', sensitive_content = false, series_number = 1, series_total = 1) {
        if (_.isNil(name)) {
            throw Error('name cannot be nil');
        }
        if (_.isNil(collection)) {
            throw Error('collection cannot be nil');
        }
        if (!_.isArrayLike(attributes)) {
            throw Error('attributes is not an array');
        }

        // attributes can be of two shapes
        // 1 - an array of name value pairs - [[string, string]]
        // 2 - the output of create attribute array [{ trait_type: 'string', value: 'string' }]
        const atttributeList = attributes.length > 0 && _.isArrayLike(attributes[0]) ?
            this.createAttributeArray(attributes, 'trait_type') :
            attributes;

        return {
            format: NFT_FORMAT,
            name: name,
            description: description,
            minting_tool: this.minting_tool,
            sensitive_content: sensitive_content,
            attributes: atttributeList,
            collection: collection,
            series_number: series_number,
            series_total: series_total,
        };
    }

    /**
     *
     * @param {[[string,string]] nameValuePairList - An array of name value pairs
     * @param {string} keyName - the name of the key field `type` for collections `trait_type` for nft
     * @returns
     */
    createAttributeArray(nameValuePairList, keyName) {
        if (!_.isArrayLike(nameValuePairList)) {
            throw Error('nameValuePairList is not an array');
        }
        if (_.isNil(keyName)) {
            throw Error('keyName cannot be nil');
        }

        return _.map(nameValuePairList, (item) => {
            const attribute = {};
            attribute[keyName] = item[0];
            attribute.value = item[1];
            return attribute;
        });
    }

    addAttribute(attributeArray, type, value, keyName) {
        if (_.isNil(attributeArray)) {
            throw Error('attributeArray cannot be nil');
        }
        if (!_.isArray(attributeArray)) {
            throw Error('attributeArray is not an array');
        }
        if (_.isNil(type)) {
            throw Error('type cannot be nil');
        }
        if (_.isNil(keyName)) {
            throw Error('keyName cannot be nil');
        }

        const attribute = {};
        attribute[keyName] = type;
        attribute.value = value;

        attributeArray.push(attribute);
    }
}
