import _ from 'lodash';
import { NftUploader, MetadataFactory } from 'chia-nft-minter';

export default async function upload(config, task, data) {
    const traits = [
        ['software_name', data.software.name],
        ['software_version', data.software.version],
        ['torch_version', data.software.torch_version],
        ['chia_version', config.chia_version],
        ['nft_software', 'nft-factory'],
        ['nft_software_version', '0.1.0'],
    ];

    // flatten the pipeline configiruation params into traits
    for (const k in data.pipeline_config) {
        const v = data.pipeline_config[k];
        if (Array.isArray(v)) {
            traits.push([k, `${v[0]}-${v[1]}`]);
        } else if (!_.isNil(v)) { // CHIPS-0007 schema doesn't allow nulls
            traits.push([k, v]);
        }
    }

    // flatten the input params into traits
    for (const k in data.parameters) {
        const v = data.parameters[k];
        if (!Number.isInteger(v) && Number.isFinite(v)) { // CHIPS-0007 schema doesn't allow floats
            traits.push([`parameter_${k}`, v.toString()]);
        } else if (!_.isNil(v)) { // CHIPS-0007 schema doesn't allow nulls
            traits.push([`parameter_${k}`, v]);
        }
    }

    const metadataFactory = new MetadataFactory('nft-factory');
    const fileNumber = `${task.seriesNumber.toString().padStart(3, '0')}`;
    const nftName = `${task.collection.name} #${fileNumber}`;
    const nftDescription = `${task.collection.name} ${task.seriesNumber} of ${task.seriesTotal}`;
    const metadata = metadataFactory.createNftMetadata(nftName,
        task.collection,
        traits,
        nftDescription,
        false,
        task.seriesNumber,
        task.seriesTotal);

    const uploader = new NftUploader(config.nft_storage_key);
    const dataFile = {
        name: `${fileNumber}.jpg`,
        type: 'image/jpeg',
        content: Buffer.from(data.image, 'base64'),
    };
    const licenseFileInfo = {
        uri: config.license_uri,
    };

    return await uploader.upload(dataFile, metadata, licenseFileInfo);
}
