import fs from 'fs';
import path from 'path';
import { homedir } from 'os';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
export const __dirname = path.dirname(__filename);

const settingsDir = path.join(homedir(), '.chia-repl');

export function settingExists(name) {
    return fs.existsSync(path.join(settingsDir, name));
}

export function getSetting(name, def) {
    try {
        const json = fs.readFileSync(path.join(settingsDir, name));
        return JSON.parse(json);
    } catch (e) {
        // console.log(`Could not load settings ${name}`);
    }

    return def;
}

export function saveSetting(name, setting) {
    try {
        if (!fs.existsSync(settingsDir)) {
            fs.mkdirSync(settingsDir, { recursive: true });
        }
        fs.writeFileSync(path.join(settingsDir, name), JSON.stringify(setting, null, 2));
    } catch (e) {
        console.log(e);
    }
}

// this is to upgrade settings that might changed from earlier serialized versions
export function fixup(settings, name, defaultValue, msg) {
    if (settings[name] === undefined) {
        settings[name] = defaultValue;
        if (msg !== undefined) {
            console.log(msg);
        }
    }
}

export function listSettings() {
    return fs.readdirSync(settingsDir);
}
