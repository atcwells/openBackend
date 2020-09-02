import {AbstractCollectionInstance} from "./AbstractCollectionInstance.js";
import {SystemController} from "../System/System.js";

export class $Collection extends AbstractCollectionInstance {
    static collection = 'core_collection';

    constructor(record) {
        super(record, SystemController.getLogger('$Collection'));
        this._fields = this.getValue('fields');
    }

    /**
     * @param {Object} initialParams
     * @returns {Promise<$Collection>}
     */
    static async create(initialParams) {
        let newCollection = await AbstractCollectionInstance.create(initialParams, $Collection.collection)
            .catch((error) => {
                SystemController.getLogger('$Collection').debug(`Unable to create record`);
                throw error;
            });

        return new $Collection(newCollection);
    }

    /**
     * @param {String} id
     * @param {String} key
     * @returns {Promise<$Collection>}
     */
    static async get(id, key = 'unique_id') {
        let collection = await AbstractCollectionInstance.get(id, key, $Collection.collection)
            .catch((error) => {
                SystemController.getLogger('$Collection').debug(`Unable to instantiate, probably unable to find by ID: ${id}`);
                throw error;
            });

        return new $Collection(collection);
    }

    static async findOne(params) {
        try {
            let collection = await AbstractCollectionInstance.findOne(params, $Collection.collection)
            return new $Collection(collection);
        } catch (error) {
            SystemController.getLogger('$Collection').debug(`Unable to instantiate, probably unable to find for params: ${JSON.stringify(params)}`);
            throw error;
        }
    }

    static async find(params) {
        try {
            let collectionInstances = await AbstractCollectionInstance.findInstances(params, $Collection.collection);
            return collectionInstances.records.map((record) => {
                return new $Collection({record, fields: collectionInstances.fields});
            })
        } catch (error) {
            SystemController.getLogger('$Collection').debug(`Unable to instantiate, probably unable to find for params: ${JSON.stringify(params)}`);
            throw error;
        }

    }
}