import {default as Sequelize} from "sequelize";
import {default as _} from "lodash";
import {AbstractCollection} from "./AbstractCollection.js";
import {AbstractSystemModule} from "../AbstractSystemModule.js";
import {DatabaseError} from "../../../error/DatabaseError.js";
import {SystemController} from "../System/System.js";

export class Database extends AbstractSystemModule {
    _sequelize = null;
    _username = null;
    _password = null;
    _databaseName = null;
    _host = null;

    _modelDefaultAttributes = {
        "unique_id": {
            type: Sequelize.UUID,
            primaryKey: Sequelize.BOOLEAN,
            defaultValue: Sequelize.UUIDV4
        },
        "_metadata": Sequelize.JSON,
        /*hooks: {
         /*beforeBulkCreate(instances, options, fn)
         beforeBulkDestroy(options, fn)
         beforeBulkUpdate(options, fn)
         beforeValidate(instance, options, fn)
         validate
         afterValidate(instance, options, fn)
         validationFailed(instance, options, error, fn)
         beforeCreate(instance, options, fn)
         beforeDestroy(instance, options, fn)
         beforeUpdate(instance, options, fn)
         create
         destroy
         update
         afterCreate(instance, options, fn)
         afterDestroy(instance, options, fn)
         afterUpdate(instance, options, fn)
         afterBulkCreate(instances, options, fn)
         afterBulkDestroy(options, fn)
         afterBulkUpdate(options, fn)
         }*/
    };

    constructor(options) {
        super(options);
        this._username = options.username;
        this._password = options.password;
        this._databaseName = options.database_name;
        this._host = options.host;
    }

    /**
     * @returns {Promise<void>}
     */
    async startup() {
        this._log = SystemController.getLogger('Database');
        let sequelizeDefinition = await this._constructSequelizeDefinition();
        this._sequelize = new Sequelize(this._databaseName, this._username, this._password, sequelizeDefinition);
        try {
            await this._sequelize.authenticate();
        } catch (errors) {
            let error = new DatabaseError.ConnectionFailure(errors);
            this._log.error(`Failed to connect to database`, error);
            throw error;
        }
    }

    /**
     * @param {String} collection
     * @param {String} column
     * @param {String} type
     * @returns {Promise<void>}
     */
    async addColumn(collection, column, type) {
        try {
            await this._sequelize.getQueryInterface().addColumn(collection, column, type)
        } catch (error) {
            this._log.error(`Failed to add column ${column} to collection: ${collection}`, error);
            throw new DatabaseError.ColumnCreationFailure(error);
        }
        this._log.debug(`Column ${column} added to collection: ${collection}`);
    }

    /**
     * @param {String} collection
     * @param {String} column
     * @returns {Promise<void>}
     */
    async removeColumn(collection, column) {
        try {
            await this._sequelize.getQueryInterface().removeColumn(collection, column)
        } catch (error) {
            this._log.error(`Failed to remove column ${column} from collection: ${collection}`, error);
            throw (error);
        }
        this._log.debug(`Column ${column} removed from collection: ${collection}`);
    }

    async alterColumnType(collection, column, type) {
        try {
            await this._sequelize.getQueryInterface().changeColumn(collection, column, type)
        } catch (error) {
            this._log.error(`Failed to change column ${column} type to: ${type}`, error);
            throw (error);
        }
        this._log.debug(`Column ${column} type changed to ${type}`);

    }

    /**
     * @param {String} collectionName
     * @returns {Promise<AbstractCollection>}
     */
    async getCollection(collectionName) {
        let collectionExists = await this._doesCollectionExist(collectionName);
        let collectionDefined = this._sequelize.models[collectionName];
        if (collectionExists && collectionDefined) {
            this._log.trace(`Found collection ${collectionName}, returning to be worked on`);
            return new AbstractCollection(this._sequelize.model(collectionName))
        }

        if (!collectionExists)
            throw new Error(`Collection ${collectionName} doesn't exist!`);

        throw new Error(`Collection ${collectionName} exists, but isn't defined!`);
    }

    /**
     * @param {String} collectionName
     * @param {Object} spec
     * @returns {Promise<AbstractCollection>}
     */
    async createCollection(collectionName, spec) {
        this._log.info(`Collection ${collectionName} creation requested...`);
        let collection;
        try {
            collection = await this.getCollection(collectionName)
            this._log.debug(`Collection ${collectionName} exists, proceeding to upgrade...`);
            await this._upgradeCollection(collectionName, spec)
        } catch (error) {
            this._log.debug(`Collection ${collectionName} does not exist, creating...`);
            collection = await this._createCollectionFromScratch(collectionName, spec);
        }
        this._log.info(`Collection ${collectionName} created successfully`);
        try {
            return new AbstractCollection(collection);
        } catch (error) {
            this._log.error(`Unable to create collection ${collectionName}`, error);
            throw (error);
        }
    }

    async removeCollection(name) {
        return await delete this._sequelize.models[name];
    }

    async rawQuery(queryString) {
        return await this._sequelize.query(queryString);
    }

    async dropAllCollections() {
        try {
            this._log.info('Dropping all tables in database');
            let results = await this.rawQuery(`select tablename from pg_tables where schemaname = 'public';`);
            await Promise.all(results[0].map((result) => {
                this._log.info(`Dropping table ${result.tablename}...`);
                return this.rawQuery(`drop table if exists ${result.tablename} cascade;`);
            }));
            return await this.startup();
        } catch (err) {
            let error = new Error(err);
            this._log.error(`Failed to drop existing collections`, error);
            throw error;
        }
    }

    async _upgradeCollection(collectionName, desiredSpecification) {
        let collectionExists = await this._doesCollectionExist(collectionName);
        let collectionDefined = this._sequelize.models[collectionName];

        if (!collectionExists || collectionDefined) {
            return Promise.reject('Unable to upgrade dbquery since it does not yet exist');
        }
        let attributes = await this._sequelize.getQueryInterface().describeTable(collectionName);
        let fullSpecification = await this._buildModelDefinition(desiredSpecification);
        let upgradeRequired = false;
        let upgradePromises = [];
        Object.keys(fullSpecification).forEach((attribute) => {
            let desiredType = '';

            if (!fullSpecification[attribute]) {
                let error = new Error();
                this._log.error(`Unable to find attribute ${attribute} for ${collectionName}`, error);
                throw error;
            }

            if (!fullSpecification[attribute].type) {
                desiredType = fullSpecification[attribute].key;
            } else {
                desiredType = fullSpecification[attribute].type.key;
            }

            if (!desiredType) {
                let error = new Error();
                this._log.error(`Unable to identify desired type from specification: ${fullSpecification}`, error);
                throw error;
            }

            if (attributes[attribute] && attributes[attribute].type == 'CHARACTER VARYING') {
                attributes[attribute].type = 'STRING';
            }

            if (!attributes[attribute]) {
                this._log.info(`Column ${attribute} does not exist, creating job to create...`);
                upgradeRequired = true;
                upgradePromises.push(new Promise((resolve) => {
                    this.addColumn(collectionName, attribute, Sequelize[desiredType])
                        .then(() => {
                            resolve();
                        });
                }));
                return;
            }

            if (attributes[attribute].type != desiredType) {
                this._log.info(`Column ${attribute} is different in database to desired specification, creating job to change column type...`);
                upgradeRequired = true;
                upgradePromises.push(new Promise((resolve) => {
                    this.alterColumnType(collectionName, attribute, Sequelize[desiredType])
                        .then(() => {
                            resolve();
                        });
                }));
                return;
            }
        });
        if (!upgradeRequired) {
            this._log.info(`Upgrade to collection not required, returning collection`);
            return Promise.resolve()
                .then(() => {
                    return this._defineCollection(collectionName, fullSpecification);
                });
        } else {
            this._log.info(`Collection required, proceeding...`);
            return Promise.all(upgradePromises)
                .then(() => {
                    return this._defineCollection(collectionName, fullSpecification);
                });
        }
    }

    async _defineCollection(collectionName, specification) {
        let _specification = _.clone(specification);
        return this._sequelize.define(collectionName, _specification, {
            freezeTableName: true,
            timestamps: false
        });
    }

    async _createCollectionFromScratch(collectionName, spec) {
        let fullSpecification;
        try {
            this._log.debug('Building Model Definition...');
            fullSpecification = await this._buildModelDefinition(spec);
            this._log.debug('Creating table...');
        } catch (error) {
            this._log.error(`Failed to create collection!`, error);
            throw error;
        }
        try {
            await this._sequelize.getQueryInterface().createTable(collectionName, fullSpecification, {})
        } catch (error) {
            this._log.error(`Failed to create database collection at Sequelize!`, error);
            throw error;
        }
        this._log.debug('Defining Model AbstractCollection...');
        return await this._defineCollection(collectionName, fullSpecification);
    }

    async _describeCollection(collectionName) {
        let attributes = await this._sequelize.getQueryInterface().describeTable(collectionName)
        return attributes;
    }

    /**
     * @param {String} collectionName
     * @returns {Promise<*|boolean>}
     * @private
     */
    async _doesCollectionExist(collectionName) {
        try {
            this._log.trace(`Checking if collection ${collectionName} exists...`);
            let result = await this.rawQuery(`SELECT to_regclass('${collectionName}');`)
            this._log.trace(`Collection ${collectionName} exists: ${result && result[1] && result[1].rows[0].to_regclass === collectionName}`);
            return result && result[1] && result[1].rows[0].to_regclass === collectionName;
        } catch (error) {
            this._log.error(`Failed to determine whether collection exists`, error);
            throw error;
        }
    }

    async _buildModelDefinition(spec) {
        return _.merge(spec, this._modelDefaultAttributes);
    }

    async _constructSequelizeDefinition() {
        return {
            host: this._host,
            dialect: 'postgres',
            operatorsAliases: '0',
            pool: {
                max: 5,
                min: 0,
                idle: 10000
            },
            define: {
                hooks: {
                    beforeCreate: function (record, options) {
                        if (!record._metadata) {
                            record._metadata = {};
                        }
                        record._metadata.created_on = new Date().getTime();
                        record._metadata.updated_on = new Date().getTime();
                        return record;
                    },
                    beforeUpdate: function (record, options) {
                        if (!record._metadata) {
                            record._metadata = {};
                        }
                        record._metadata.updated_on = new Date().getTime();
                        return record;
                    }
                }
            }
        }
    }
}
