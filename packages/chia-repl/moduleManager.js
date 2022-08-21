import path from 'path';
import { readdir } from 'fs/promises';
import os from 'os';
import log from './logger.js';
import _ from 'lodash';

const homeDirectory = os.homedir();

export default class ModuleManager {
    constructor(scriptFolder) {
        this.scriptFolder = scriptFolder;
        // this keeps the list of modules loaded so they can be cleared out later
        this.modules = [];
    }

    unloadModules(context) {
        if (this.scriptFolder === undefined) {
            return;
        }
        if (_.isNil(context)) {
            throw new Error('context cannot be nil');
        }

        this.modules.forEach(item => context[item] = undefined);
        this.modules = [];
    }

    async loadModules(context) {
        if (this.scriptFolder === undefined) {
            return;
        }
        if (_.isNil(context)) {
            throw new Error('context cannot be nil');
        }

        const fullFolderPath = untildify(this.scriptFolder);

        const getDirectories = async source =>
            (await readdir(source, { withFileTypes: true }))
                .filter(dirent => dirent.isDirectory())
                .map(dirent => dirent.name);
        const modules = await getDirectories(fullFolderPath);

        for await (const moduleName of asyncIterator(modules)) {
            // make sure we don't overwrite anything
            if (context[moduleName] === undefined) {
                try {
                    // this requires that the following e true:
                    // - `dir` (ie the folder name) is used as the name of the module
                    // - in the dir we're looking at, there is a file with the same name and the mjs extension
                    // - the mjs module has all of its dependencies installed
                    // - the mjs module has a default export
                    // - that default export is class type defintion whose constructor we can call
                    // - once instantiated and passed the context object it is on its own
                    const uri = `file://${path.join(fullFolderPath, moduleName, `${moduleName}.mjs`)}`;
                    const module = await import(uri);

                    const ctor = module.default;
                    context[moduleName] = new ctor(context);
                    this.modules.push(moduleName)
                    log(`Loaded ${moduleName} module`, 'status');
                } catch (e) {
                    log(`Could not load module ${moduleName}`, 'warning');
                    log(e, 'error');
                }
            } else {
                log(`${moduleName} already exists. This module has been skipped.`, 'warning');
            }
        }
    }
}

async function* asyncIterator(list) {
    for (let i = 0; i < list.length; i++) {
        yield list[i];
    }
}

function untildify(pathWithTilde) {
    if (typeof pathWithTilde !== 'string') {
        throw new Error(`Expected a string, got ${typeof pathWithTilde}`);
    }

    return homeDirectory ? pathWithTilde.replace(/^~(?=$|\/|\\)/, homeDirectory) : pathWithTilde;
}