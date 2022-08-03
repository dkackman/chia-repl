import chai from 'chai';
import { MetadataFactory } from '../chia-nft-minter/metadata_factory.js';
import { validate as uuidValidate } from 'uuid';
import _ from 'lodash';

const expect = chai.expect;

describe('chia-minter', () => {
    describe('metadata', () => {
        it('createNftMetadata should populate', () => {
            const factory = new MetadataFactory();
            const collectionMetaData = factory.createCollectionMetadata('_COLLECTION_NAME_');
            const nftMetadata = factory.createNftMetadata('_NFT_NAME_', collectionMetaData);
            expect(nftMetadata).to.not.equal(null);
            expect(nftMetadata).to.not.equal(undefined);
            expect(nftMetadata.name).to.equal('_NFT_NAME_');
            expect(uuidValidate(nftMetadata.collection.id)).to.equal(true);
        });
        it('createCollectionMetadata should have a uuid for the collection id', () => {
            const factory = new MetadataFactory();
            const collectionMetaData = factory.createCollectionMetadata('_COLLECTION_NAME_');
            expect(collectionMetaData).to.not.equal(null);
            expect(collectionMetaData).to.not.equal(undefined);
            expect(collectionMetaData.name).to.equal('_COLLECTION_NAME_');
            expect(uuidValidate(collectionMetaData.id)).to.equal(true);
        });
        it('createNftMetadata should respect minting_tool', () => {
            const factory = new MetadataFactory('_MINING_TOOL_');
            const collectionMetaData = factory.createCollectionMetadata('_COLLECTION_NAME_');
            const nftMetadata = factory.createNftMetadata('_NFT_NAME_', collectionMetaData);
            expect(nftMetadata.minting_tool).to.equal('_MINING_TOOL_');
        });
        it('createAttributeArray should create an array of {type, value} objects', () => {
            const factory = new MetadataFactory();
            const attributeArray = factory.createAttributeArray([['_TYPE0_', '_VALUE0_'], ['_TYPE1_', '_VALUE1_']]);
            expect(_.isArray(attributeArray)).to.equal(true);
            expect(attributeArray.length).to.equal(2);

            const attribute0 = attributeArray[0];
            expect(attribute0.type).to.equal('_TYPE0_');
            expect(attribute0.value).to.equal('_VALUE0_');

            const attribute1 = attributeArray[1];
            expect(attribute1.type).to.equal('_TYPE1_');
            expect(attribute1.value).to.equal('_VALUE1_');
        });
        it('addAttribute should append a new attribute object', () => {
            const factory = new MetadataFactory();
            const attributeArray = factory.createAttributeArray([['_TYPE0_', '_VALUE0_'], ['_TYPE1_', '_VALUE1_']]);
            factory.addAttribute(attributeArray, '_NEW_TYPE_', '_NEW_VALUE_');
            expect(attributeArray.length).to.equal(3);

            const attribute0 = attributeArray[2];
            expect(attribute0.type).to.equal('_NEW_TYPE_');
            expect(attribute0.value).to.equal('_NEW_VALUE_');
        });
    });
});
