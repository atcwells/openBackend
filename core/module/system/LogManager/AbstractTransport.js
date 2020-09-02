import {LogLevel} from "./LogLevel.js";

export class AbstractTransport {
    logLevel;

    constructor(options) {
        this.logLevel = LogLevel[options.level.toUpperCase()];
    }

    async writeLine(msg) {

    }

    async writeError(err) {

    }
}