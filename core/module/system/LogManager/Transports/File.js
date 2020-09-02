import {Date} from "../../../../util/Date.js";
import {AbstractTransport} from "../AbstractTransport.js";
import * as fs from "fs";

export class File extends AbstractTransport {
    _logPath;
    _fileType = 'txt';
    _fullPath;

    constructor(options) {
        super(options);
        this._logPath = `.${options.filePath}`;
        this._fullPath = this._constructFullPathSync();
        try {
            let stats = fs.lstatSync(this._fullPath);
            if (stats.isFile()) {
                // No need to handle, file already exists
            }
        }
        catch (e) {
            fs.writeFileSync(this._fullPath, ``);
        }
    }

    _constructFullPathSync() {
        let date = Date.getCurrentDate();
        return `${this._logPath}/log.${date}.${this._fileType}`;
    }

    async _constructFullPath() {
        let date = Date.getCurrentDate();
        return `${this._logPath}/log.${date}.${this._fileType}`;
    }

    async writeError(err) {
        const filePath = await this._constructFullPath()
            .then((filePath) => {
                fs.appendFile(filePath, err + '\r\n', function (err) {
                });
            });
    }

    async writeLine(msg) {
        const filePath = await this._constructFullPath()
            .then((filePath) => {
                fs.appendFile(filePath, msg.getString() + '\r\n', function (err) {
                });
            });
    }
}
