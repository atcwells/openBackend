import {AbstractSystemModule} from "../AbstractSystemModule.js";
import {SystemController} from "../System/System.js";
import {SystemError} from "../../../error/SystemError.js";
import {asyncForEach} from "../../../util/asyncForEach.js";
import {default as _} from "lodash";
import {default as shell} from "shelljs";
import {ManifestFile} from "./ManifestFile.js";
import {default as semver} from "semver";
import {UpgradePackage} from "./UpgradePackage.js";
import {Operation, Transaction} from "../Transaction/Transaction.js";

export class SystemInstaller extends AbstractSystemModule {

    _log = SystemController.getLogger('SystemInstaller');
    upgradeDir = `${shell.pwd()}/version`;

    /**
     * @type {ManifestFile[]}
     */
    _upgradeQueue = [];

    /**
     * @param options
     */
    constructor(options) {
        super(options);
    }

    /**
     * @returns {Promise<void>}
     */
    async installInitiallyRequiredObjects() {
        await SystemController.dropAllCollections();
        try {
            let requiredCollectionConfigurations = [];
            let defaultTypes = {
                'short_string': 'varchar',
                'json': 'json',
            };
            shell.ls(`${this.upgradeDir}/_required/core_collection.*.json`).forEach(file => {
                let collectionContents = JSON.parse(shell.cat(file))
                Object.keys(collectionContents.fields).forEach(field => {
                    let simpleFieldType = collectionContents.fields[field].type;
                    collectionContents.fields[field].type = defaultTypes[simpleFieldType];
                });
                requiredCollectionConfigurations.push(collectionContents);
            });

            await asyncForEach(requiredCollectionConfigurations, async collectionRecord => {
                try {
                    let fields = _.clone(collectionRecord.fields);
                    await SystemController.createCollection(collectionRecord.name, fields);
                } catch (error) {
                    this._log.error(`Encountered error installing ${collectionRecord.name}, failure at:`, error);
                }
            });

            await asyncForEach(requiredCollectionConfigurations, async collectionRecord => {
                try {
                    let collection = await SystemController.getCollection('core_collection');
                    return await collection.create(_.merge(collectionRecord, {
                        _metadata: {
                            "collection_name": "core_collection",
                            "created_by": "SYSTEM",
                            "updated_by": "SYSTEM"
                        }
                    }));
                } catch (error) {
                    this._log.error(`Encountered error installing ${collectionRecord.name}, failure at:`, error);
                }
            });

            let requiredFieldConfigurations = [];
            shell.ls(`${this.upgradeDir}/_required/core_collection_field_type.*.json`).forEach(file => {
                requiredFieldConfigurations.push(JSON.parse(shell.cat(file)));
            });
            await asyncForEach(requiredFieldConfigurations, async fieldRecord => {
                try {
                    let fieldTypes = await SystemController.getCollection('core_collection_field_type');
                    return await fieldTypes.create(_.merge(fieldRecord, {
                        _metadata: {
                            "created_on": 1483228800,
                            "created_by": "SYSTEM",
                            "updated_on": 1483228800,
                            "updated_by": "SYSTEM",
                            "collection_name": "core_collection_field_type",
                            "indexes": {}
                        }
                    }));
                } catch (error) {
                    this._log.error(`Encountered error installing ${fieldRecord.name}, failure at:`, error);
                }
            });

            let requiredCollectionTypeConfigurations = [];
            shell.ls(`${this.upgradeDir}/_required/core_collection_type.*.json`).forEach(file => {
                requiredCollectionTypeConfigurations.push(JSON.parse(shell.cat(file)));
            });
            await asyncForEach(requiredCollectionTypeConfigurations, async collectionTypeRecord => {
                try {
                    let fieldTypes = await SystemController.getCollection('core_collection_type');
                    return await fieldTypes.create(_.merge(collectionTypeRecord, {
                        _metadata: {
                            "created_on": 1483228800,
                            "created_by": "SYSTEM",
                            "updated_on": 1483228800,
                            "updated_by": "SYSTEM",
                            "collection_name": "core_collection_type",
                            "indexes": {}
                        }
                    }));
                } catch (error) {
                    this._log.error(`Encountered error installing ${collectionTypeRecord.name}, failure at:`, error);
                }
            });

        } catch (error) {
            let sysError = new SystemError.SystemInstallationFailure(error);
            this._log.error(`Encountered error installing System, failure at:`, sysError);
            throw error;
        }
    }

    /**
     * @returns {Promise<void>}
     */
    async upgradeFromScratch() {
        let upgradeDir = `${shell.pwd()}/version`;
        shell.ls(upgradeDir).forEach(file => {
            if (file.startsWith('_'))
                return;

            let manifestFiles = shell.ls(`${upgradeDir}/${file}`).reduce((acc, fileName) => {
                if (fileName.startsWith('core_manifest')) {
                    acc.push(fileName)
                }
                return acc;
            }, []);

            if (manifestFiles.length === 1) {
                let manifest = new ManifestFile(`${upgradeDir}/${file}/${manifestFiles[0]}`);
                this._upgradeQueue.push(manifest);
            }

            if (manifestFiles.length > 1) {

            }
        });

        await this._doUpgrades();
    }

    /**
     * @returns {Promise<void>}
     * @private
     */
    async _doUpgrades() {
        let maxBreak = 100;

        while (this._upgradeQueue.length && maxBreak--) {
            console.log(this._upgradeQueue);
            await asyncForEach(this._upgradeQueue, async (manifest, index) => {
                if (!manifest.dependencies.length) {
                    await this.installUpgrade(manifest);
                    this._upgradeQueue.splice(index, 1);
                    return;
                }

                if (await this._areDependenciesInstalled(manifest)) {
                    this._log.info(`All dependencies installed for ${manifest.name}`);
                    await this.installUpgrade(manifest);
                    this._upgradeQueue.splice(index, 1);
                    return;
                }

                if (!await this._canFulfillDependenciesInUpgradePath(manifest)) {
                    this._log.error(`Cannot fulfill required dependencies to install ${manifest.name}, cancelling install`);
                    this._upgradeQueue.splice(index, 1);
                    return;
                }

                this._log.info(`Required dependency in upgrade path, but not installed yet, continuing to await dependent package installation`)
            });
        }
    }

    /**
     * @param {ManifestFile} manifest
     * @returns {Promise<void>}
     */
    async installUpgrade(manifest) {
        let upgradePackage = new UpgradePackage(manifest);
        await upgradePackage.validate();
        await upgradePackage.install();
    }

    /**
     * @param {ManifestFile} manifest
     * @returns {boolean}
     * @private
     */
    async _areDependenciesInstalled(manifest) {
        let manifests = await SystemController.getCollection('core_manifest');
        let uninstalledDependencies = [];

        await asyncForEach(manifest.dependencies, async dependency => {
            for (const moduleName in dependency) {
                if (!dependency.hasOwnProperty(moduleName))
                    return;

                let transaction = new Transaction({
                    collection: 'core_manifest',
                    operation: Operation.GET,
                    parameters: {
                        name: moduleName,
                        version: dependency[moduleName]
                    }
                });
                let results = await transaction.execute();
                let dependencyInstalled = await manifests.findAll({
                    name: moduleName
                });
                let foundDependency = false;
                dependencyInstalled.forEach((record) => {
                    if (semver.satisfies(record.version, dependency[moduleName])) {
                        foundDependency = true;
                    }
                });
                if (!foundDependency)
                    uninstalledDependencies.push(`${moduleName}:${dependency[moduleName]}`);
            }
        });

        if (uninstalledDependencies.length)
            this._log.error(`Module dependencies [${uninstalledDependencies.join(', ')}] not installed, cannot install ${manifest.name}`, new Error('ARGH!'));

        return uninstalledDependencies.length === 0;
    }

    /**
     * @param {ManifestFile} manifest
     * @returns {boolean}
     * @private
     */
    async _canFulfillDependenciesInUpgradePath(manifest) {
        if (await this._dependenciesInUpgradePath(manifest)) {
            return true;
        }

        return false;
    }

    /**
     * @param {ManifestFile} manifest
     * @returns {boolean}
     * @private
     */
    async _dependenciesInUpgradePath(manifest) {
        let unfilledDependencies = [];

        manifest.dependencies.forEach(dependency => {
            for (const moduleName in dependency) {
                if (!dependency.hasOwnProperty(moduleName))
                    return;

                let foundQueuedManifest = false;
                this._upgradeQueue.forEach(queuedManifest => {
                    if (queuedManifest.name === moduleName &&
                        semver.satisfies(queuedManifest.version, dependency[moduleName])) {
                        foundQueuedManifest = true;
                        this._log.debug(`Found module ${moduleName}:${dependency[moduleName]} to fulfill dependency for ${manifest.name}`);
                    }
                });

                if (foundQueuedManifest)
                    return;

                this._log.error(`Module dependency ${moduleName}:${dependency[moduleName]} not found, cannot install ${manifest.name}`);
                unfilledDependencies.push(`${moduleName}:${dependency[moduleName]}`);
            }
        });

        if (unfilledDependencies.length)
            this._log.error(`Module dependencies [${unfilledDependencies.join(', ')}] not found, cannot install ${manifest.name}`);

        return unfilledDependencies.length === 0;
    }
}
