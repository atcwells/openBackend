import * as fs from "fs";
import {AbstractMessageModule} from "../AbstractMessageModule";

export class FileSystemWriter extends AbstractMessageModule {
    _logPath = './log/test.txt';
    _fileType = 'txt';
    _fullPath;

    constructor(options) {
        super(options);
        this._logPath = `.${options.filePath}`;
        this._fullPath = this._constructFullPath();
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

    async startup() {
        return new Promise((resolve, reject) => {
            resolve();
        });
    }

    async shutdown() {
        return new Promise((resolve, reject) => {
            resolve();
        });
    }

    async restart() {
        return new Promise((resolve, reject) => {
            resolve();
        });
    }

    _constructFullPath() {
        let date = new Date().getCurrentDate();
        return `${this._logPath}/log.${date}.${this._fileType}`;
    }

    async writeError(err) {
        return this._constructFullPath()
            .then((filePath) => {
                fs.appendFile(filePath, err + '\r\n', function (err) {

                });
            });
    }

    async writeLine(msg) {
        return this._constructFullPath()
            .then((filePath) => {
                fs.appendFile(filePath, msg.getString() + '\r\n', function (err) {

                });
            });
    }
}
