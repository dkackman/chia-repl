import path from 'path';
import { readdir } from 'fs/promises'
import os from 'os';

const homeDirectory = os.homedir();

export default async function loadModules(context, scriptFolder) {
    if (scriptFolder === undefined) {
        return;
    }

    const fullFolderPath = untildify(scriptFolder);

    const getDirectories = async source =>
        (await readdir(source, { withFileTypes: true }))
            .filter(dirent => dirent.isDirectory())
            .map(dirent => dirent.name);

    const directories = await getDirectories(fullFolderPath);
    for await (const dir of directories) {
        try {
            // make sure we don't overwrite anything
            if (context[dir] !== undefined) {
                console.log(`${dir} already exists. This module will be skipped`);
            } else {
                const uri = `file://${path.join(fullFolderPath, dir, `${dir}.mjs`)}`;
                /* jshint ignore:start */
                const module = await import(uri);
                /* jshint ignore:end */

                const ctor = module.default;
                context[dir] = new ctor(context);
            }
        } catch (e) {
            console.log(`Could not load module ${dir}`);
            console.log(e);
        }
    }
}

function untildify(pathWithTilde) {
    if (typeof pathWithTilde !== 'string') {
        throw new Error(`Expected a string, got ${typeof pathWithTilde}`);
    }

    return homeDirectory ? pathWithTilde.replace(/^~(?=$|\/|\\)/, homeDirectory) : pathWithTilde;
}
