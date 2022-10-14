import axios from "axios";

//
// This is an experminatal integration into the fing stable-diffucsion service - https://github.com/dkackman/fing
//
// A minimal demostration of how to use fing and chia-repl to generate a stable-diffusion image and create an NFT
// 1. Generate image & metadat from text
// 2. Transform meta data into traits
// 3. Push metadata and image to nft.storage
// 4. Mint NFT with the resulting links
//
export default async function txt2nft(
    prompt,
    wallet_id,
    target_address,
    nft_description,
    collection_name,
    collection_description,
    x_api_key,
    metadataFactory,
    minter,
    royalty_address = target_address,
    royalty_percentage = 250,
    fee = 1000,
    license_file = 'https://raw.githubusercontent.com/CompVis/stable-diffusion/main/LICENSE',
    fing_server_uri = 'http://cuddly:9147'
) {
    // this first part is using fing to generate the image and meta data
    // https://github.com/dkackman/fing
    const image_data = await axios.get(`${fing_server_uri}/txt2img?prompt=${prompt}&format=json`, {
        headers: {
            "x-api-key": x_api_key
        }
    });

    const traits = [];

    traits.push(['software_name', image_data.data.software.name]);
    traits.push(['software_version', image_data.data.software.version]);
    traits.push(['torch_version', image_data.data.software.torch_version]);
    traits.push(['chia_version', "1.6.0"]);
    traits.push(['nft_software', "chia-repl"]);
    traits.push(['nft_software_version', "0.16.0"]);

    for (const k in image_data.data.pipeline_config) {
        const v = image_data.data.pipeline_config[k];
        if (Array.isArray(v)) {
            traits.push([k, `${v[0]}-${v[1]}`]);
        } else {
            traits.push([k, v]);
        }
    }

    for (const k in image_data.data.parameters) {
        const v = image_data.data.parameters[k];
        if (!Number.isInteger(v) && Number.isFinite(v)) {
            traits.push([`parameter_${k}`, v.toString()]); // CHIPS-0007 schema doesn't allow floats
        } else {
            traits.push([`parameter_${k}`, v]);
        }
    }

    // evverything form here on down assumes you are in the chia-repl
    // the same concepts would apply with any other integration to nft.storage and chia rpc
    const collection = metadataFactory.createCollectionMetadata(collection_name, [
        ['description', collection_description],
        ['twitter', '@dkackman'],
        ['website', 'https://github.com/dkackman/fing'],
    ]);

    const metadata = metadataFactory.createNftMetadata(prompt, collection, traits, nft_description);

    const dataFile = {
        name: `${prompt}.jpg`,
        type: 'image/jpeg',
        content: Buffer.from(image_data.data.image, 'base64')
    };
    const licenseFile = {
        uri: license_file
    };
    const ipfs = await minter.upload(dataFile, JSON.stringify(metadata, null, 2), licenseFile);

    const mingtingInfo = {
        wallet_id: wallet_id,
        target_address: target_address,
        royalty_address: royalty_address,
        royalty_percentage: royalty_percentage,
        fee: fee,
    };

    return await minter.createNftFromIpfs(mingtingInfo, ipfs);
}
