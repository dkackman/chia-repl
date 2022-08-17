import path from 'path';
import { readdir } from 'fs/promises'
import os from 'os';
import chalk from 'chalk';

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
        // make sure we don't overwrite anything
        if (context[dir] === undefined) {
            try {
                // this requires that the following is true:
                // - `dir` (ie the folder name) is considered the name of the module
                // - in the dir we're looking at, there is a file with the same name but the mjs extension
                // - the mjs module has all of its dependencies installed
                // - the mjs module has a default export
                // - that default export is class type defintion whose contructor we can call
                // - once instantiated and passed the context object it is onits own
                const uri = `file://${path.join(fullFolderPath, dir, `${dir}.mjs`)}`;
                /* jshint ignore:start */
                const module = await import(uri);
                /* jshint ignore:end */

                const ctor = module.default;
                context[dir] = new ctor(context);
                console.log(chalk.gray(`Loaded ${dir} module`));
            } catch (e) {
                console.log(`Could not load module ${dir}`);
                console.log(e);
            }
        } else {
            console.log(`${dir} already exists. This module has been skipped.`);
        }
    }
}

function untildify(pathWithTilde) {
    if (typeof pathWithTilde !== 'string') {
        throw new Error(`Expected a string, got ${typeof pathWithTilde}`);
    }

    return homeDirectory ? pathWithTilde.replace(/^~(?=$|\/|\\)/, homeDirectory) : pathWithTilde;
}
