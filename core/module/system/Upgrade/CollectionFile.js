import {default as Sequelize} from "sequelize";
import {UpgradeFile} from "./UpgradeFile.js";
import {SystemController} from "../System/System.js";
import {$Collection} from "../Database/$Collection.js";
import {$CollectionFieldType} from "../Database/$CollectionFieldType.js";

export class CollectionFile extends UpgradeFile {
    _log = SystemController.getLogger('CollectionFile');
    type = "core_collection";

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
        let specification = await this._createCollectionSpecificationFromFile();
        await SystemController.createCollection(this.json.name, specification);
        try {
            let coreCollection = await $Collection.get(this.json.name, "name");
            for (let key in this.json) {
                coreCollection.setValue(key, this.json[key]);
            }
            return await coreCollection.save();
        } catch (err) {
            return $Collection.create(this.json);
        }
    }

    /**
     * @returns {Promise<void>}
     * @private
     */
    async _createCollectionSpecificationFromFile() {
        try {
            let promises = [];
            for (let fieldName in this.json.fields) {
                let field = this.json.fields[fieldName];
                promises.push((async (field) => {
                    return await this._getInternalFieldType(field)
                })(field))
            }
            let fieldTypes = await Promise.all(promises);
            let specification = {};
            fieldTypes.forEach((fieldType) => {
                specification[fieldType.field] = fieldType.type
            });
            return specification;
        } catch (error) {
            this._log.error(`Failed to create collection for plugin file: ${this.sourceFilePath}`, error);
            throw (error);
        }
    }

    /**
     * @param {Object<String, String>} field
     * @returns {Promise<{field: *, type: *}>}
     * @private
     */
    async _getInternalFieldType(field) {
        let fieldType = await $CollectionFieldType.findOne({
            name: field.type
        });
        if (fieldType) {
            const internalType = fieldType.getValue('internal_type');
            return {
                field: field.name,
                type: Sequelize[internalType]
            };
        }

        let defaultTypes = {
            short_string: 'STRING',
            true_false: 'BOOLEAN',
            json: 'JSONB',
        };

        this._log.debug(`Attempting to determine default internal_type for requested type: ${field.type}`);
        if (field && field.type && Sequelize[defaultTypes[field.type]])
            return {
                field: field.name,
                type: Sequelize[defaultTypes[field.type]]
            };

        let err = new Error();
        this._log.error(`Unable to understand '${field.type}' field type for field: ${field.name}`, err);
        throw err;
    }
}
