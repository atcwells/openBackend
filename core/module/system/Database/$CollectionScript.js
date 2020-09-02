import {AbstractCollectionInstance} from "./AbstractCollectionInstance";
import {$CollectionAction} from "./$CollectionAction";
import {SystemController} from "../System/System.js";

export class $CollectionScript extends AbstractCollectionInstance {
    static collection = 'collection_script';

    constructor(recordAndFields) {
        super(recordAndFields, SystemController.getLogger('$CollectionScript'));
    }

    async execute(collectionAction, params) {
        let executionContext = sc.executionContext.get(this.getValue('name'));
        let instance = await executionContext.get(params.unique_id);
        return instance[collectionAction.getValue('method_name')](params);
    }

    getMethodNames() {
        return $CollectionAction.find({
            'collection_script': this.getId()
        }).then((collectionActions) => {
            return collectionActions.map((collectionAction) => {
                return collectionAction.getValue('name');
            });
        })
    }

    static async create(initialParams) {
        let collectionScript = await AbstractCollectionInstance.create(initialParams, $CollectionScript.collection)
            .catch((error) => {
                SystemController.getLogger('$CollectionScript').debug(`Unable to create record`);
                throw error;
            });

        return new $CollectionScript(collectionScript);
    }

    static async get(id, key = 'unique_id') {
        let collectionScriptInstance = await AbstractCollectionInstance.get(id, key, $CollectionScript.collection)
            .catch((error) => {
                SystemController.getLogger('$CollectionScript').debug(`Unable to instantiate, probably unable to find $CollectionScript for ID: ${id}`);
                throw error;
            });

        return new $CollectionScript(collectionScriptInstance);
    }

    static async findOne(params) {
        let collectionScriptInstance = AbstractCollectionInstance.findOne(params, $CollectionScript.collection)
            .catch((error) => {
                SystemController.getLogger('$CollectionScript').debug(`Unable to instantiate, probably unable to find $CollectionScript for params: ${JSON.stringify(params)}`);
                throw error;
            });

        return new $CollectionScript(collectionScriptInstance);
    }

    static async find(params) {
        let collectionScriptInstances = await AbstractCollectionInstance.findInstances(params, $CollectionScript.collection)
            .catch((error) => {
                SystemController.getLogger('$CollectionScript').debug(`Unable to instantiate, probably unable to find $CollectionScript for params: ${JSON.stringify(params)}`);
                throw error;
            });

        return collectionScriptInstances.records.map((record) => {
            return new $CollectionScript({
                record,
                fields: collectionScriptInstances.fields
            });
        })
    }
}