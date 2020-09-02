import {Logger} from "../logger/Logger";
import {AbstractCollectionInstance, AbstractCollectionInstances} from "./AbstractCollectionInstance";
import {$CollectionScript} from "./$CollectionScript";
import {SystemController} from "../System/System.js";

export class $CollectionAction extends AbstractCollectionInstance {
    static collection = 'collection_action';

    constructor(record) {
        super(record, SystemController.getLogger('$CollectionAction'));
    }

    execute(record) {
        return $CollectionScript.get(this.getValue('collection_script'))
            .then((collectionScript) => {
                return collectionScript.execute(this, record);
            });
    }

    static create(initialParams) {
        return AbstractCollectionInstance.create(initialParams, $CollectionAction.collection)
            .then((collectionAction) => {
                return new $CollectionAction(collectionAction);
            })
    }

    static get(id, key = 'unique_id') {
        return AbstractCollectionInstance.get(id, key, $CollectionAction.collection)
            .then((collectionAction) => {
                return new $CollectionAction(collectionAction);
            })
            .catch((error) => {
                SystemController.getLogger('$CollectionAction').debug(`Unable to instantiate, probably unable to find CollectionAction for ID: ${id}`);
                throw error;
            });
    }

    static findOne(params) {
        return AbstractCollectionInstance.findOne(params, $CollectionAction.collection)
            .then((collectionAction) => {
                return new $CollectionAction(collectionAction);
            })
            .catch((error) => {
                SystemController.getLogger('$CollectionAction').debug(`Unable to instantiate, probably unable to find for params: ${JSON.stringify(params)}`);
                throw error;
            });
    }

    static find(params) {
        return AbstractCollectionInstance.findInstances(params, $CollectionAction.collection)
            .then((collections) => {
                return collections.records.map((record) => {
                    return new $CollectionAction({
                        record,
                        fields: collections.fields
                    });
                })
            })
            .catch((error) => {
                SystemController.getLogger('$CollectionAction').debug(`Unable to instantiate, probably unable to find for params: ${JSON.stringify(params)}`);
                throw error;
            });
    }
}