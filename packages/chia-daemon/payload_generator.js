import yaml from 'js-yaml';
import fs from 'fs';
import path from 'path';
import _ from 'lodash';
import { fileURLToPath } from 'url';

/* jshint ignore:start */
const __dirname = path.dirname(fileURLToPath(import.meta.url));
/* jshint ignore:end */

/**
 * Creates an object that matches the given endpoint's request schema.
 * @param {string} service - The name of the chia rpc service.
 * @param {string} endpoint - The endpoint on that service.
 * @returns An object instance matching the payload schema with default poperty values set.
 */
export function makePayload(service, endpoint, requiredOnly = true) {
    const schema = flattenSchema(getPayloadDescriptor(service, endpoint));
    if ((_.isNil(_.get(schema, 'properties')) || Object.keys(schema.properties).length === 0)) {
        return undefined;
    }

    const requiredFields = _.get(schema, 'required', []);
    const payload = {};
    Object.entries(schema.properties).forEach(function ([property, typeDef]) {
        // add the property to the returned object if
        // - the caller requested all properties
        // - or the property has a default value
        // - or the property is required
        if (!requiredOnly || typeDef.default !== undefined || requiredFields.includes(property)) {
            payload[property] = getDefaultValue(typeDef);
        }
    });
    return payload;
}

// flattens out a schema that includes an 'allOf' array of schemas
function flattenSchema(schema) {
    const allOf = _.get(schema, 'allOf'); // allOf requires sepcial handling
    if (!_.isNil(allOf)) {
        const flattenedSchema = {
            type: 'object'
        };

        // combine all of the required arrays
        flattenedSchema.required = allOf
            .filter(item => item.required !== undefined)
            .flatMap((value, /*key, collection*/) => value.required);

        // combine all of the properties objects into one object
        const properties = allOf
            .flatMap((value, /*key, collection*/) => value.properties);
        flattenedSchema.properties = _.merge({}, ...properties);

        return flattenedSchema;
    }

    // the schema wasn't an 'allOf' - just return it
    return schema;
}

/**
 * Returns the descriptor of the response object schema in OpenAPI format.
 * @param {string} service - The name of the chia rpc service.
 * @param {string} endpoint - The endpoint on that service.
 * @returns The schema property of the requestBody, if present.
 */
export function getPayloadDescriptor(service, endpoint) {
    // actual chia service names start with chia_, so strip that out
    const specname = service.replace('chia_', '').replace('_simulator', '');
    const spec = yaml.load(fs.readFileSync(path.resolve(__dirname, `openapi/${specname}.yaml`), 'utf8'));
    const p = spec.paths[`/${endpoint}`]; // path names will have the slash in them
    if (_.isNil(p)) {
        return undefined;
    }

    // this is not generically transferrable to non-chia openapi specs
    return _.get(p, 'post.requestBody.content.application/json.schema');
}

function getDefaultValue(typeDef) {
    if (typeDef.default !== undefined) {
        return typeDef.default;
    }

    if (typeDef.type === 'integer') {
        return 0;
    }

    if (typeDef.type === 'number') {
        return 0.0;
    }

    if (typeDef.type === 'string') {
        return '';
    }

    if (typeDef.type === 'boolean') {
        return false;
    }

    if (typeDef.type === 'array') {
        return [];
    }

    if (typeDef.type === 'object') {
        return getDefaultValue(typeDef.properties);
    }

    return {};
}
