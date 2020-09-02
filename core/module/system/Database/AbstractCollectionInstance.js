import {SystemController} from "../../system/System/System.js";
import {DatabaseQueryOperator} from "./DatabaseQueryOperator.js";
import {$Collection} from "./$Collection.js";

export class AbstractCollectionInstance {

    _record = null;
    _fields = null;
    /**
     * @type {Object[]}
     * @private
     */
    static _defaultFields = [
        {
            "name": "unique_id",
            "type": "reference"
        },
        {
            "name": "_metadata",
            "type": "json"
        }];

    constructor(recordAndFields, log) {
        if (!recordAndFields.record)
            throw new Error('No record supplied, something has gone very wrong!');

        this._record = recordAndFields.record;
        this._fields = recordAndFields.fields;
        this._log = log || SystemController.getLogger('AbstractCollectionInstance');
    }

    async save(params) {
        if (params) {
            this.setValues(params);
        }
        let savedRecord = this._record.save()
        return savedRecord;
    }

    async destroy() {
        let deletedRecord = await this._record.destroy();
        return deletedRecord;
    }

    setValue(fieldName, value) {
        return this._record[fieldName] = value;
    }

    setValues(params) {
        for (const key in params) {
            if (params.hasOwnProperty(key) && this._record[key])
                this.setValue(key, params[key]);
        }
    }

    toObject() {
        let obj = {
            _methods: {}
        };
        this._fields.forEach((fieldDefinition) => {
            obj[fieldDefinition.name] = this.getValue(fieldDefinition.name);
        });
        return obj;
    }

    getValue(fieldName) {
        let rawFieldValue = this._record.getDataValue(fieldName);

        // if (Array.isArray(this._fields))
        //     for (const field of this._fields) {
        //         if (field.name === fieldName && field.type === 'vue_template')
        //             return new VueTemplate(rawFieldValue).value;
        //
        //         if (field.name === fieldName && field.type === 'massive_string')
        //             return new MassiveString(rawFieldValue).value;
        //
        //         if (field.name === fieldName && field.type === 'script')
        //             return new Script(rawFieldValue).value;
        //
        //         if (field.name === fieldName && field.type === 'vue_script')
        //             return new VueScript(rawFieldValue).value;
        //     }

        return rawFieldValue;
    }

    getValues(fieldNames) {
        const results = {};
        fieldNames.forEach((fieldName) => {
            results[fieldName] = this.getValue(fieldName);
        });
        return results;
    }

    getId() {
        return this._record.getDataValue('unique_id');
    }

    static async _getCollection(collectionName) {
        return await SystemController.getCollection(collectionName)
    }

    static async _getCoreCollection(collectionName, record) {
        let collectionInstance;
        if (collectionName == 'core_collection') {
            collectionInstance = new $Collection({
                record
            });
        } else {
            let collection = await AbstractCollectionInstance._getCollection(collectionName);
            collectionInstance = await collection.getCollectionInstance();
        }
        return collectionInstance;
    }

    static async _getCollectionFields(collection) {
        let managedFields = collection.getValue('fields');
        if (!managedFields || !managedFields.concat)
            return [];

        return managedFields.concat(AbstractCollectionInstance._defaultFields);
    }

    static async create(initialAttributes, collectionName) {
        let collection = await AbstractCollectionInstance._getCollection(collectionName);
        let record = await collection.create(Object.assign({
            "_metadata": {
                "collection_name": collectionName
            }
        }, initialAttributes));
        let collectionInstance = await AbstractCollectionInstance._getCoreCollection(collectionName, record);
        let fields = await AbstractCollectionInstance._getCollectionFields(collectionInstance);
        return {
            record,
            fields,
        }
    }

    static async get(id, key = 'unique_id', collectionName) {
        try {
            let collection = await AbstractCollectionInstance._getCollection(collectionName)
            let record = await collection.findOne({
                [DatabaseQueryOperator.WHERE]: {
                    [key]: id
                }
            });
            if (!record)
                throw new Error(`Unable to find record with ${key}: ${id} in collection ${collectionName}`);

            let collectionInstance = await AbstractCollectionInstance._getCoreCollection(collectionName, record);
            let fields = await AbstractCollectionInstance._getCollectionFields(collectionInstance);
            return {
                record,
                fields
            }
        } catch (error) {
            throw error;
        }
    }

    static async findOne(params, collectionName) {
        try {
            let collection = await AbstractCollectionInstance._getCollection(collectionName)
            let record = await collection.findOne({
                [DatabaseQueryOperator.WHERE]: params
            });
            if (!record)
                throw new Error(`Unable to find record with params: ${JSON.stringify(params)} in collection ${collectionName}`);

            let collectionInstance = await AbstractCollectionInstance._getCoreCollection(collectionName, record);
            let fields = await AbstractCollectionInstance._getCollectionFields(collectionInstance);
            return {
                record,
                fields
            }
        } catch (error) {
            throw error;
        }
    }

    static async findInstances(params, collectionName) {
        try {
            let collection = await AbstractCollectionInstance._getCollection(collectionName)
            let records = await collection.findAll({
                [DatabaseQueryOperator.WHERE]: params
            });
            if (!records)
                throw new Error(`Unable to find record with params: ${JSON.stringify(params)} in collection ${collectionName}`);

            let collectionInstance = await AbstractCollectionInstance._getCoreCollection(collectionName, records[0]);
            let fields = await AbstractCollectionInstance._getCollectionFields(collectionInstance);
            return {
                records,
                fields
            }
        } catch (error) {
            throw error;
        }
    }
}