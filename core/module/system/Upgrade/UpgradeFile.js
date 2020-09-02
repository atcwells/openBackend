import {SystemController} from "../System/System.js";
import {DatabaseQueryOperator} from "../Database/DatabaseQueryOperator.js";
import {default as shell} from "shelljs";

export class UpgradeFile {
    type = 'generic';
    sourceFilePath;
    fileLoaded = false;
    fileBooted = false;
    fileValidated = false;
    _log = SystemController.getLogger('UpgradeFile');
    name = "";
    json;
    fileName;

    /**
     * @param {String} filePath
     */
    constructor(filePath) {
        try {
            this.sourceFilePath = filePath;
            this.fileName = this.sourceFilePath.split('/').pop();
            this.json = JSON.parse(shell.cat(this.sourceFilePath));
            this.fileLoaded = true;
        } catch (error) {
            this._log.error(`File to load file, something wrong with file path ${this.sourceFilePath}`, error);
            throw error;
        }
    }

    /**
     * @returns {Promise<*>}
     */
    async bootFile() {
        let pluginFile = await SystemController.getCollection(this.json._metadata.collection_name);
        let existingPluginFile = await pluginFile.findOne({
            [DatabaseQueryOperator.WHERE]: {
                unique_id: this.json.unique_id
            }
        });
        if (!existingPluginFile) {
            this.fileBooted = true;
            return pluginFile.create(this.json);
        } else {
            this.fileBooted = true;
            return existingPluginFile.update(this.json);
        }
    }

    /**
     * @returns {Promise<void>}
     */
    async checkValidity() {
        try {
            if (!this._isValidFile(this.json)) {
                this._log.error(`File failed validity checks`, new Error('File is not valid!'));
                throw(new Error('File is not valid!'))
            }

            this._log.debug(`File ${this.fileName} passed validity checks`);
            this.fileValidated = true;
        } catch (error) {
            {
                this._log.error(`File ${this.fileName} failed validity checks`, error);
            }
        }
    }

    /**
     *
     * @param {Object} file
     * @returns {boolean}
     * @private
     */
    _isValidFile(file) {
        let pluginFile = file;
        let isValid = true;
        let requiredFields = [
            'unique_id'
        ];

        let metadataRequiredFields = [
            'collection_name',
            'created_on',
            'created_by',
            'updated_on',
            'updated_by',
        ];

        metadataRequiredFields.forEach(requiredField => {
            if (!(requiredField in pluginFile._metadata)) {
                this._log.error(`Required Metadata field ${requiredField} not found in ${this.fileName}, file is invalid`, new Error());
                isValid = false;
            }
        });

        requiredFields.forEach(requiredField => {
            if (!(requiredField in pluginFile)) {
                this._log.error(`Required field ${requiredField} not found in ${this.fileName}, file is invalid`, new Error());
                isValid = false;
            }
        });

        return isValid;
    }
}
