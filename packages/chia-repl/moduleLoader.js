import path from 'path';
import { readdir } from 'fs/promises';
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
    const modules = await getDirectories(fullFolderPath);

    for await (const moduleName of asyncIterator(modules)) {
        // make sure we don't overwrite anything
        if (context[moduleName] === undefined) {
            try {
                // this requires that the following e true:
                // - `dir` (ie the folder name) is considered the name of the module
                // - in the dir we're looking at, there is a file with the same name and the mjs extension
                // - the mjs module has all of its dependencies installed
                // - the mjs module has a default export
                // - that default export is class type defintion whose constructor we can call
                // - once instantiated and passed the context object it is on its own
                const uri = `file://${path.join(fullFolderPath, moduleName, `${moduleName}.mjs`)}`;
                const module = await import(uri);

                const ctor = module.default;
                context[moduleName] = new ctor(context);
                console.log(chalk.gray(`Loaded ${moduleName} module`));
            } catch (e) {
                console.log(`Could not load module ${moduleName}`);
                console.log(e);
            }
        } else {
            console.log(`${moduleName} already exists. This module has been skipped.`);
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
