import chai from 'chai';
import { MetadataFactory, NFT_FORMAT } from 'chia-nft-minter';
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
        it('createNftMetadata should respect minting_tool value', () => {
            const factory = new MetadataFactory('_MINING_TOOL_');
            const collectionMetaData = factory.createCollectionMetadata('_COLLECTION_NAME_');
            const nftMetadata = factory.createNftMetadata('_NFT_NAME_', collectionMetaData);
            expect(nftMetadata.minting_tool).to.equal('_MINING_TOOL_');
        });
        it('createNftMetadata should set the format', () => {
            const factory = new MetadataFactory();
            const collectionMetaData = factory.createCollectionMetadata('_COLLECTION_NAME_');
            const nftMetadata = factory.createNftMetadata('_NFT_NAME_', collectionMetaData);
            expect(nftMetadata.format).to.equal(NFT_FORMAT);
        });
        it('createAttributeArray should create an array of {type, value} objects', () => {
            const factory = new MetadataFactory();
            const attributeArray = factory.createAttributeArray([['_TYPE0_', '_VALUE0_'], ['_TYPE1_', '_VALUE1_']], 'type');
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
            const attributeArray = factory.createAttributeArray([['_TYPE0_', '_VALUE0_'], ['_TYPE1_', '_VALUE1_']], 'type');
            factory.addAttribute(attributeArray, '_NEW_TYPE_', '_NEW_VALUE_', 'type');
            expect(attributeArray.length).to.equal(3);

            const attribute0 = attributeArray[2];
            expect(attribute0.type).to.equal('_NEW_TYPE_');
            expect(attribute0.value).to.equal('_NEW_VALUE_');
        });
        it('createCollectionMetadata should add attributes from name value pairs', () => {
            const factory = new MetadataFactory();
            const collectionMetadata = factory.createCollectionMetadata('_COLLECTION_NAME_',
                [
                    ['_TYPE0_', '_VALUE0_'],
                    ['_TYPE1_', '_VALUE1_']
                ]);
            expect(_.isNil(collectionMetadata)).to.equal(false);
            expect(_.isNil(collectionMetadata.attributes)).to.equal(false);
            expect(collectionMetadata.attributes.length).to.equal(2);

            const attribute0 = collectionMetadata.attributes[0];
            expect(_.isNil(attribute0)).to.equal(false);
            expect(_.isNil(attribute0.type)).to.equal(false);
            expect(_.isNil(attribute0.value)).to.equal(false);
        });
        it('createCollectionMetadata should add attributes from array of attribute objects', () => {
            const factory = new MetadataFactory();
            const attributes = factory.createAttributeArray(
                [
                    ['_TYPE0_', '_VALUE0_'],
                    ['_TYPE1_', '_VALUE1_']
                ],
                'type'
            );
            const collectionMetadata = factory.createCollectionMetadata('_COLLECTION_NAME_', attributes);
            expect(_.isNil(collectionMetadata)).to.equal(false);
            expect(_.isNil(collectionMetadata.attributes)).to.equal(false);
            expect(collectionMetadata.attributes.length).to.equal(2);

            const attribute0 = collectionMetadata.attributes[0];
            expect(_.isNil(attribute0)).to.equal(false);
            expect(_.isNil(attribute0.type)).to.equal(false);
            expect(_.isNil(attribute0.value)).to.equal(false);
        });
    });
});
