import fs from 'fs';
import path from 'path';
import { homedir } from 'os';
import { fileURLToPath } from 'url';
import log from './logger.js';

/* jshint ignore:start */
export const __dirname = path.dirname(fileURLToPath(import.meta.url));
/* jshint ignore:end */

const packagejson = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'));
export const version = packagejson.version;

const settingsDir = path.join(homedir(), `.${packagejson.name}`);

export function settingExists(name) {
    return fs.existsSync(path.join(settingsDir, name));
}

export function getSettingObject(name, def) {
    try {
        const json = fs.readFileSync(path.join(settingsDir, name));
        const saved = JSON.parse(json);
        return {
            ...def,
            ...saved
        }; // merge saved setting with defaults in case a future version has added new fields
    } catch (e) {
        saveSetting(name, def);
    }

    return def;
}

export function getSetting(name, def) {
    try {
        const json = fs.readFileSync(path.join(settingsDir, name));
        return JSON.parse(json);
    } catch (e) {
        saveSetting(name, def);
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
        log(e, 'error');
    }
}

export function listSettings() {
    try {
        return fs.readdirSync(settingsDir);
    }
    catch (e) {
        return [];
    }
}
