// adapted from https://github.com/Chia-Network/chia-blockchain-gui
import yaml from "js-yaml";
import fs from "fs";
import path from "path";
import _ from "lodash";
import { getChiaRoot } from "chia-root-resolver";

/**
 * Loads the daemon connection details from the default config's ui section.
 * @param {string} net - The name of the network and ~/.chia/ file path to find the config file.
 * @returns Connection details.
 */
export default function loadUIConfig() {
    const config = readConfigFile();

    const selfHostname = _.get(config, "ui.daemon_host", "localhost");
    const daemonPort = _.get(config, "ui.daemon_port", 55400);

    const configRootDir = getChiaRoot();

    const certPath = path.resolve(
        configRootDir,
        _.get(
            config,
            "ui.daemon_ssl.private_crt",
            "config/ssl/daemon/private_daemon.crt"
        )
    );
    const keyPath = path.resolve(
        configRootDir,
        _.get(
            config,
            "ui.daemon_ssl.private_key",
            "config/ssl/daemon/private_daemon.key"
        )
    );

    return {
        host: selfHostname,
        port: daemonPort,
        key_path: keyPath,
        cert_path: certPath,
        timeout_seconds: 30,
    };
}

function readConfigFile() {
    const configRootDir = getChiaRoot();

    return yaml.load(
        fs.readFileSync(
            path.resolve(configRootDir, "config/config.yaml"),
            "utf8"
        )
    );
}
