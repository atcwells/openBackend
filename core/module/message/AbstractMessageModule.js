import {AbstractModule} from "../AbstractModule";

const LOG_LEVELS = {
    DEBUG: 'debug',
    WARN: 'warn',
    TRACE: 'trace',
    ERROR: 'error'
};

export class AbstractMessageModule extends AbstractModule {
    logLevel = LOG_LEVELS.ERROR;

    constructor(options) {
        super(options);
        this.logLevel = options.level;
    }

    async writeLine(msg) {
        return new Promise((resolve, reject) => {
            reject();
        });
    }

    async writeError(err) {
        return new Promise((resolve, reject) => {
            reject();
        });
    }

    async startup() {
        return new Promise((resolve, reject) => {
            reject();
        });
    }

    async shutdown() {
        return new Promise((resolve, reject) => {
            reject();
        });
    }

    async restart() {
        return new Promise((resolve, reject) => {
            reject();
        });
    }
}
