import {Database} from "../Database/Database.js";
import {ModuleManager} from "../Module/ModuleManager.js";
import {CacheServer} from "../CacheManager/CacheServer.js";
import {$Collection} from "../Database/$Collection.js";

let _logManager = null;
let _moduleManager = null;
let _database = null;
let _cacheServer = null;

export class SystemController {


    constructor(logManager, options) {
        _logManager = logManager;
        this._log = _logManager.getLogger('SystemController');
        this.options = options;
    }

    async startup() {
        _moduleManager = new ModuleManager(this.options);
        await _moduleManager.startup();
        _database = new Database(this.options);
        await _database.startup();
        this._log.info(`Starting CacheServer module`);
        _cacheServer = new CacheServer(this.options.cache_server);
        await _cacheServer.startup();
    }

    /**
     * @param {String} collectionName
     * @returns {Promise<$Collection>}
     */
    async getCollection(collectionName) {
        return await _database.getCollection(collectionName);
    }

    /**
     * @param {String} collectionName
     * @param {Object} spec
     * @returns {Promise<Promise<*>|Promise<AbstractCollection>>}
     */
    async createCollection(collectionName, spec) {
        return _database.createCollection(collectionName, spec);
    }

    async addFields(fields) {
        return Promise.all(fields.map((field) => {
            return _database.addColumn(field.collectionName, field.fieldName, field.fieldType);
        }));
    }

    async addField(collectionName, fieldName, fieldType) {
        return _database.addColumn(collectionName, fieldName, fieldType);
    }

    async removeFields(fields) {
        return Promise.all(fields.map((field) => {
            return _database.removeColumn(field.collectionName, field.fieldName);
        }));
    }

    async removeField(collectionName, fieldName) {
        return _database.removeColumn(collectionName, fieldName);
    }

    async changeFieldType(collectionName, fieldName, newFieldType) {
        return _database.alterColumnType(collectionName, fieldName, newFieldType);
    }

    async query(queryString) {
        return Promise.resolve().then(() => {
            return _database.rawQuery(queryString);
        })
    }

    async dropAllCollections() {
        return _database.dropAllCollections();
    }

    static cache = {
        getProperty: keyName => {
            return this._cache.get(keyName)
        },
        setProperty: (keyName, value) => {
            return this._cache.set(keyName, value)
        },
        wrap: (keyName, value) => {
            return this._cache.wrap(keyName, value);
        },
        deleteKey: (keyName) => {
            return this._cache.deleteKey(keyName);
        }
    };

    /**
     * @param {String} className
     * @returns {Logger}
     */
    getLogger(className) {
        return _logManager.getLogger(className);
    }

    writeMessage(msg) {
        _logManager.writeMessage(msg);
    }

    shutdownAllModules() {
        return _moduleManager.shutdownAllComponents();
    }
}