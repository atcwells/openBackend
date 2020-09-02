import {AbstractCollectionInstance} from "./AbstractCollectionInstance.js";
import {SystemController} from "../System/System.js";

export class $CollectionFieldType extends AbstractCollectionInstance {
    static collection = 'core_collection_field_type';

    constructor(record) {
        super(record, SystemController.getLogger('$CollectionFieldType'));
    }

    static async create(initialParams) {
        let collectionFieldType = await AbstractCollectionInstance.create(initialParams, $CollectionFieldType.collection)
        return new $CollectionFieldType(collectionFieldType);
    }

    /**
     * @param {String} id
     * @param {String} key
     * @returns {Promise<$CollectionFieldType>}
     */
    static async get(id, key = 'unique_id') {
        try {
            let collectionFieldType = await AbstractCollectionInstance.get(id, key, $CollectionFieldType.collection);
            return new $CollectionFieldType(collectionFieldType);
        } catch (error) {
            SystemController.getLogger('$CollectionFieldType').debug(`Unable to instantiate, probably unable to find by ID: ${id}`);
            throw error;
        }
    }

    static async findOne(params) {
        try {
            let collectionFieldType = await AbstractCollectionInstance.findOne(params, $CollectionFieldType.collection);
            return new $CollectionFieldType(collectionFieldType);
        } catch (error) {
            SystemController.getLogger('$CollectionFieldType').debug(`Unable to instantiate, probably unable to find for params: ${JSON.stringify(params)}`);
            throw error;
        }
    }

    static async find(params) {
        try {
            let collections = await AbstractCollectionInstance.findInstances(params, $CollectionFieldType.collection);
            return await collections.records.map((record) => {
                return new $CollectionFieldType({
                    record,
                    fields: collections.fields
                });
            })
        } catch (error) {
            SystemController.getLogger('$CollectionFieldType').debug(`Unable to instantiate, probably unable to find for params: ${JSON.stringify(params)}`);
            throw error;
        }
    }
}