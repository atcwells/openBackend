import {LogLevel} from "./LogLevel.js";
import {Date} from "../../../util/Date.js";

class LogLine {
    _line;
    _error;
    logLevel;

    constructor(line, logLevel, error, logManager) {
        this._line = line;
        this._error = error;
        this.logLevel = logLevel;
        this.logManager = logManager;
    }

    getError() {
        return this._error && this._error.stack;
    }

    getString() {
        return this._line;
    }
}

export class Logger {
    _callingClass;
    _lineWriter;
    _showParams = false;

    constructor(callingClass, lineWriter) {
        this._callingClass = callingClass;
        this._lineWriter = lineWriter;
    }

    emergency(msg, error) {
        const logLine = new LogLine(`${Date.getLogDate()} - EMERGENCY - [${this._callingClass}] ${msg}`, LogLevel.EMERGENCY, error);
        this._writeLine(logLine);
    }

    alert(msg, error) {
        const logLine = new LogLine(`${Date.getLogDate()} - ALERT - [${this._callingClass}] ${msg}`, LogLevel.ALERT, error);
        this._writeLine(logLine);
    }

    critical(msg, error) {
        const logLine = new LogLine(`${Date.getLogDate()} - CRITICAL - [${this._callingClass}] ${msg}`, LogLevel.CRITICAL, error);
        this._writeLine(logLine);
    }

    error(msg, error) {
        const logLine = new LogLine(`${Date.getLogDate()} - ERROR - [${this._callingClass}] ${msg}`, LogLevel.ERROR, error);
        this._writeLine(logLine);
    }

    warn(msg) {
        const logLine = new LogLine(`${Date.getLogDate()} - WARN - [${this._callingClass}] ${msg}`, LogLevel.WARNING);
        this._writeLine(logLine);
    }

    notice(msg) {
        const logLine = new LogLine(`${Date.getLogDate()} - NOTICE - [${this._callingClass}] ${msg}`, LogLevel.NOTICE);
        this._writeLine(logLine);
    }

    info(msg) {
        const logLine = new LogLine(`${Date.getLogDate()} - INFO - [${this._callingClass}] ${msg}`, LogLevel.INFO);
        this._writeLine(logLine);
    }

    debug(msg) {
        const logLine = new LogLine(`${Date.getLogDate()} - DEBUG - [${this._callingClass}] ${msg}`, LogLevel.DEBUG);
        this._writeLine(logLine);
    }

    trace(msg) {
        const logLine = new LogLine(`${Date.getLogDate()} - TRACE - [${this._callingClass}] ${msg}`, LogLevel.TRACE);
        this._writeLine(logLine);
    }

    _writeLine(logLine) {
        this._lineWriter(logLine);
    }
}
