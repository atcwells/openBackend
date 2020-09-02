import {UpgradeFile} from "./UpgradeFile.js";
import {SystemController} from "../System/System.js";
import {$CollectionFieldType} from "../Database/$CollectionFieldType.js";

export class FieldTypeFile extends UpgradeFile {
    _log = SystemController.getLogger('FieldTypeFile');
    type = 'core_collection_field_type';

    /**
     * @param {String} filePath
     */
    constructor(filePath) {
        super(filePath);
    }

    /**
     * @returns {Promise<*>}
     */
    async bootFile() {
        this._log.debug(`Searching for file type ${this.json.name} in database...`);
        let fieldType;
        try {
            fieldType = await $CollectionFieldType.get(this.json.unique_id)
            this._log.debug(`Updating existing field type [${this.json.name}]`);
        } catch (exception) {
            this._log.debug(`Could not find field type in database, so creating [${this.json.name}]`);
            fieldType = await $CollectionFieldType.create(this.json);
        }

        for (const key in this.json)
            if (this.json.hasOwnProperty(key))
                fieldType.setValue(key, this.json[key]);

        this._log.debug(`Updated existing file type ${this.json.name} in database`);
        return fieldType.save();
    }
}
