import axios from 'axios';
import _ from 'lodash';

export default async function fing(config, task) {
    const negativePromptPart = _.isEmpty(task.negative_prompt) ? '' : `&negative_prompt=${task.negative_prompt}`;
    const imageData = await axios.get(`${config.fing_uri}/txt2img?prompt=${task.prompt}&format=json${negativePromptPart}`, {
        timeout: 120000,
        headers: {
            'x-api-key': config.fing_x_api_key,
        },
    });

    return imageData.data;
}
