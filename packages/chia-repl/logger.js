import chalk from 'chalk';

const logMap = new Map();
logMap.set('church-mouse', new Map([
    //['info', s => s],
    ['error', chalk.redBright],
    //['warning', chalk.yellow],
    //['status', chalk.grey],
    // ['debug', chalk.cyan],
]));
logMap.set('quiet', new Map([
    ['info', s => s],
    ['error', chalk.redBright],
    ['warning', chalk.yellow],
    //['status', chalk.grey],
    // ['debug', chalk.cyan],
]));
logMap.set('normal', new Map([
    ['info', s => s],
    ['error', chalk.redBright],
    ['warning', chalk.yellow],
    ['status', chalk.grey],
    // ['debug', chalk.cyan],
]));
logMap.set('verbose', new Map([
    ['info', s => s],
    ['error', chalk.redBright],
    ['warning', chalk.yellow],
    ['status', chalk.grey],
    ['debug', chalk.cyan],
]));

let verbosityMap = logMap.get('normal');

export function setVerbosity(v) {
    if (!logMap.has(v)) {
        verbosityMap = logMap.get('normal');
        log(`Unrecognized verbosity level ${v}`, 'warning');
    } else {
        verbosityMap = logMap.get(v);
        log(`Verbosity set to ${v}`, 'debug');
    }
}

export default function log(message, logLevel = 'info') {
    const formatter = verbosityMap.get(logLevel);
    if (formatter !== undefined) {
        console.log(formatter(message));
    }
}
