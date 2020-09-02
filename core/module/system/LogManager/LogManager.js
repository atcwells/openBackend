import {AbstractSystemModule} from "../AbstractSystemModule.js";
import {SystemState} from "../System/System.js";
import {LogLevel} from "./LogLevel.js";
import {Logger} from "./Logger.js";
import {File} from "./Transports/File.js";
import {Console} from "./Transports/Console.js";

const LogTransports = {
    "Console": Console,
    "File": File
};

export class LogManager extends AbstractSystemModule {

    _transports = [];
    _buffer = [];

    constructor(options) {
        super(options);
    }

    async startup() {
        this.options.log_transports.forEach(logTransportConfig => {
            if (!LogTransports[logTransportConfig.name])
                throw Error(`Unrecognized log transport with name: ${logTransportConfig.name}`);

            if (!logTransportConfig.level)
                logTransportConfig.level = LogLevel.TRACE;

            const LogTransportClass = LogTransports[logTransportConfig.name];
            this._transports.push(new LogTransportClass(logTransportConfig));
        });
    }

    async shutdown() {

    }

    async restart() {

    }

    getLogger(callingClass) {
        let writeLine = (logLine) => {
            this._writeLine(logLine)
        };
        return new Logger(callingClass, writeLine);
    }

    async writeMessage(logLine) {
        if (!SystemState.isReady())
            return this._addToBuffer(logLine);

        if (this._buffer.length)
            await this._flushBuffer();

        return await this._writeLine(logLine)
            .catch((error) => {
                console.log(`Failed to write log message: ` + error);
            });
    }

    async _addToBuffer(logLine) {
        if (this._buffer.length >= this.options.max_buffer_length) {
            console.log(this._buffer.shift());
            this._buffer.push(logLine);
            return false;
        }

        return this._buffer.push(logLine);
    }

    async _flushBuffer() {
        let logLine;
        while (logLine = this._buffer.shift()) {
            await this._writeLine(logLine);
        }
    }

    async _writeLine(logLine) {
        return Promise.all(this._transports.map(async transport => {
            if (LogManager._shouldPrint(logLine.logLevel, transport))
                await transport.writeLine(logLine);

            if (LogManager._shouldPrintError(logLine.logLevel))
                await transport.writeError(logLine.getError());

        })).catch((error) => {
            console.log(`Failed to write log Line: ${error}`);
        });
    }

    static _shouldPrint(logLevel, transport) {
        // TODO: improve implementation
        return logLevel <= transport.logLevel;
    }

    static _shouldPrintError(logLevel) {
        // TODO: improve implementation
        return logLevel == LogLevel.ERROR;
    }
}
