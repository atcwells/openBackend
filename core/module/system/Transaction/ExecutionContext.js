import {AbstractCollectionInstance} from "./collection/AbstractCollectionInstance";
import {$CollectionScript} from "./collection/$CollectionScript";
import {$Collection} from "./collection/$Collection";
import {$CollectionAction} from "./collection/$CollectionAction";
import {sc} from "../../main";
import * as vm from "vm";
import {Logger} from "./logger/Logger";
import {$AppAPI} from "./transaction/$AppAPI";
import {$AppAPIMethod} from "./transaction/$AppAPIMethod";

export class ExecutionContext {
    _collectionScriptContexts = new Map();
    _collectionNameContexts = new Map();

    constructor() {

    }

    async rebuildCollectionContexts() {
        let collections = await $Collection.find({});
        return await Promise.all(collections.map(async (collection) => {
            let collectionScript = await $CollectionScript.get(collection.getId(), 'collection')
                .catch(() => {
                    this._log.debug(`Unable to find Collection Script, people will not be able to use the ${collection.getValue('name')}`);
                    return undefined;
                });

            if (collectionScript)
                return Promise.resolve(this.addCollectionContext(
                    collection, collectionScript));

            return Promise.resolve(this.addCollectionContext(
                collection, undefined));
        }));
    }

    async addCollectionContext(collection, collectionScript) {
        let collectionScriptClass = await this._generateExecutionContext(collection, collectionScript)
            .catch((error) => {
                this._log.error(`Unable to create Execution Context for ${collection}`, error);
                return false;
            });

        try {
            const collectionName = collection.getValue('name');
            const collectionScriptName = collectionScript.getValue('name');
            this._collectionNameContexts.set(collectionName, collectionScriptName);
            this._collectionScriptContexts.set(collectionScriptName, collectionScriptClass);
            return true;
        } catch (e) {
            return false;
        }
    }

    get(collectionName) {
        if (collectionName.startsWith('$'))
            return this.getByCollectionScriptName(collectionName)

        return this.getByCollectionName(collectionName);
    }

    getByCollectionName(collectionName) {
        let collectionScriptName = this._collectionNameContexts.get(collectionName);
        if (collectionScriptName)
            return this.getByCollectionScriptName(collectionScriptName);

        return undefined;
    }

    getByCollectionScriptName(collectionScriptName) {
        let context = this._collectionScriptContexts.get(collectionScriptName);
        if (context)
            return context;

        return undefined;
    }

    async _generateExecutionContext(collection, collectionScript) {
        let collectionScriptClass = {};

        if (!collection || !collectionScript)
            return undefined;

        try {
            const customisedFunctions = await this._getCustomisedFunctions(collection, collectionScript);
            const scriptedClass = await this._constructContextualClass(
                collectionScript.getValue('name'),
                collection.getValue('name'),
                customisedFunctions);

            const script = new vm.Script(scriptedClass);
            const dependencies = await this._getContextDependencies(collectionScript);
            const context = vm.createContext(dependencies);
            collectionScriptClass = script.runInContext(context);
        } catch (e) {
            console.log(e);
        }
        return collectionScriptClass;
    }

    async _getContextDependencies(collectionScript) {
        return {
            sc,
            AbstractCollectionInstance,
            Logger,
            $Collection,
            $AppAPI,
            $AppAPIMethod
        };
    }

    async _getCustomisedFunctions(collection, collectionScript) {
        let actions = await $CollectionAction.find({
            'collection_script': collectionScript.getId()
        });

        let scriptedActions = [];

        if (!actions)
            return scriptedActions;

        actions.map((action) => {
            scriptedActions.push(action.getValue('script'));
        });

        return scriptedActions;
    }

    async _constructContextualClass(collectionScriptName, collectionName, customizedFunctions) {
        let defaultMethods = `
            static async create(initialParams) {
                let newCollection = await AbstractCollectionInstance.create(initialParams, ${collectionScriptName}.collection)
                    .catch((error) => {
                        new Logger('${collectionScriptName}').debug(\`Unable to create record\`);
                        throw error;
                    });
            
                return new ${collectionScriptName}(newCollection);
            }
    
            static async get(id, key = 'unique_id') {
                let collection = await AbstractCollectionInstance.get(id, key, ${collectionScriptName}.collection)
                    .catch((error) => {
                        new Logger('${collectionScriptName}').debug('Unable to instantiate, probably unable to find by ID: ' + id);
                        throw error;
                    });
            
                return new ${collectionScriptName}(collection);
            }
            
            static async findOne(params) {
                let collection = await AbstractCollectionInstance.findOne(params, ${collectionScriptName}.collection)
                    .catch((error) => {
                        new Logger('${collectionScriptName}').debug('Unable to instantiate, probably unable to find for params: ' + JSON.stringify(params));
                        throw error;
                    });
            
                return new ${collectionScriptName}(collection);
            }
            
            static async find(params) {
                let collectionInstances = await AbstractCollectionInstance.findInstances(params, ${collectionScriptName}.collection)
                    .catch((error) => {
                        new Logger('${collectionScriptName}').debug('Unable to instantiate, probably unable to find for params: ' + JSON.stringify(params));
                        throw error;
                    });
            
                return collectionInstances.records.map((record) => {
                    return new ${collectionScriptName}({record, fields: collectionInstances.fields});
                })
            }`;

        let classOutline = `
        (function() { 
            let newClass = class ${collectionScriptName} extends AbstractCollectionInstance {
    
                constructor(record) {
                    super(record, new Logger('${collectionScriptName}'));
                }
                
                ${customizedFunctions.join('\n\n')}
                
                ${defaultMethods}
            }
            
            newClass.collection = '${collectionName}';
            return newClass;
        })()`;

        return classOutline;
    }
}