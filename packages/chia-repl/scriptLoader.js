import path from 'path';
import fs from 'fs';
import os from 'os';

const homeDirectory = os.homedir();

export async function loadScripts(context, scriptFolder) {
    if (scriptFolder === undefined) {
        return;
    }

    const fullFolderPath = untildify(scriptFolder);
    fs.readdir(fullFolderPath, (err, files) => {
        if (err) {
            console.log(err);
        } else {
            const ext = '.mjs';
            files
                .filter(file => path.extname(file).toLowerCase() === ext)
                .forEach(async function (file) {
                    try {
                        const name = path.basename(file, ext);
                        // make sure we don't overwrite anything
                        if (context[name] !== undefined) {
                            console.log(`${name} already exists. This module will be skipped`);
                        } else {
                            const uri = `file://${path.join(fullFolderPath, file)}`;
                            const module = await import(uri);
                            context[name] = module;
                        }
                    } catch (e) {
                        console.log(`Could not load script ${file}`);
                        console.log(e);
                    }
                });
        }
    });
}

function untildify(pathWithTilde) {
    if (typeof pathWithTilde !== 'string') {
        throw new Error(`Expected a string, got ${typeof pathWithTilde}`);
    }

    return homeDirectory ? pathWithTilde.replace(/^~(?=$|\/|\\)/, homeDirectory)
        : pathWithTilde;
}
