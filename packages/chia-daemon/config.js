import { createChiaConnectionFromConfig } from "chia-service-connector";

/**
 * Loads the daemon connection details from the default config's ui section.
 * @param {string} net - The name of the network and ~/.chia/ file path to find the config file.
 * @returns Connection details.
 */
export default function loadUIConfig() {
    return createChiaConnectionFromConfig("ui");
}
