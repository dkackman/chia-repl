//
// A minimal demostration of how to use fing and chia-repl to generate a stable-diffusion image and create an NFT
// 1. Generate image & metadat from text
// 2. Transform meta data into traits
// 3. Push metadata and image to nft.storage
// 4. Mint NFT with the resulting links
//
async function txt2nft(prompt, wallet_id, target_address, fee = 1000, collectionName = "An NFT Collection from stable diffusion") {
    // this first part is using fing to generate the image and meta data
    // https://github.com/dkackman/fing
    const image_data = await axios.get(`http://localhost:9147/txt2img_metadata?prompt=${prompt}`);

    const traits = [];
    traits.push(['model_name', image_data.data.model._class_name]);
    traits.push(['model_version', image_data.data.model._diffusers_version]);
    traits.push(['software_name', image_data.data.software.name]);
    traits.push(['software_version', image_data.data.software.version]);
    traits.push(['torch_version', image_data.data.software.torch_version]);

    traits.push(['feature_extractor', `${image_data.data.model.feature_extractor[0]}-${image_data.data.model.feature_extractor[1]}`]);
    traits.push(['safety_checker', `${image_data.data.model.safety_checker[0]}-${image_data.data.model.safety_checker[1]}`]);
    traits.push(['scheduler', `${image_data.data.model.scheduler[0]}-${image_data.data.model.scheduler[1]}`]);
    traits.push(['text_encoder', `${image_data.data.model.text_encoder[0]}-${image_data.data.model.text_encoder[1]}`]);
    traits.push(['tokenizer', `${image_data.data.model.tokenizer[0]}-${image_data.data.model.tokenizer[1]}`]);
    traits.push(['unet', `${image_data.data.model.unet[0]}-${image_data.data.model.unet[1]}`]);
    traits.push(['vae', `${image_data.data.model.vae[0]}-${image_data.data.model.vae[1]}`]);

    traits.push(['guidance_scale', image_data.data.parameters.guidance_scale.toString()]); // CHIPS-0007 schema doesn't allow floats
    traits.push(['height', image_data.data.parameters.height]);
    traits.push(['num_images', image_data.data.parameters.num_images]);
    traits.push(['num_inference_steps', image_data.data.parameters.num_inference_steps]);
    traits.push(['prompt', image_data.data.parameters.prompt]);
    traits.push(['width', image_data.data.parameters.width]);

    // evverything form here on down assumes you are in the chia-repl
    // the same concepts would apply with any other integration to nft.storage and chia rpc
    const collection = metadataFactory.createCollectionMetadata(collectionName, [
        ['description', 'An NFT collection of generative art made with fing and chia-repl'],
        ['twitter', '@dkackman'],
        ['website', 'https://github.com/dkackman/fing'],
    ]);

    const metadata = metadataFactory.createNftMetadata(prompt, collection, traits);
    const dataFile = {
        name: `${prompt}.jpg`,
        type: 'image/jpeg',
        content: Buffer.from(image_data.data.image, 'base64')
    };
    const licenseFile = {
        uri: 'https://raw.githubusercontent.com/CompVis/stable-diffusion/main/LICENSE'
    };
    const ipfs = await minter.upload(dataFile, JSON.stringify(metadata, null, 2), options.ipfsToken, licenseFile);

    const mingtingInfo = {
        wallet_id: wallet_id,
        target_address: target_address,
        fee: fee,
    };

    const spend_bundle = await minter.createNftFromIpfs(mingtingInfo, ipfs);
    return spend_bundle;
}
