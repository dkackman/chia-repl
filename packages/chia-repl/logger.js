import chalk from 'chalk';

const verbosityMap = new Map([
    ['church-mouse', new Map([
        //['info', s => s],
        ['error', chalk.redBright],
        //['warning', chalk.yellow],
        //['status', chalk.grey],
        //['debug', chalk.cyan],
        ['always', s => s],
    ])],
    ['quiet', new Map([
        ['info', s => s],
        ['error', chalk.redBright],
        ['warning', chalk.yellow],
        //['status', chalk.grey],
        //['debug', chalk.cyan],
        ['always', s => s],
    ])],
    ['normal', new Map([
        ['info', s => s],
        ['error', chalk.redBright],
        ['warning', chalk.yellow],
        ['status', chalk.grey],
        //['debug', chalk.cyan],
        ['always', s => s],
    ])],
    ['verbose', new Map([
        ['info', s => s],
        ['error', chalk.redBright],
        ['warning', chalk.yellow],
        ['status', chalk.grey],
        ['debug', chalk.cyan],
        ['always', s => s],
    ])],
]);

let logLevelMap = verbosityMap.get('normal');

export function setVerbosity(v) {
    if (!verbosityMap.has(v)) {
        logLevelMap = verbosityMap.get('normal');
        log(`Unrecognized verbosity level ${v}`, 'warning');
    } else {
        logLevelMap = verbosityMap.get(v);
        log(`Verbosity set to ${v}`, 'debug');
    }
}

export default function log(message, logLevel = 'info') {
    const formatter = logLevelMap.get(logLevel);
    if (formatter !== undefined) {
        console.log(formatter(message));
    }
}
