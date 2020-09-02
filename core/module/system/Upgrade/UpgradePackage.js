import {SystemController} from "../System/System.js";
import {ManifestFile} from "./ManifestFile.js";
import {asyncForEach} from "../../../util/asyncForEach.js";
import {default as shell} from "shelljs";
import {UpgradeFile} from "./UpgradeFile.js";
import {CollectionFile} from "./CollectionFile.js";
import {FieldTypeFile} from "./FieldTypeFile.js";

/**
 * @type {{VALID: string, INVALID: string}}
 */
const STATE = {
    VALID: 'VALID',
    INVALID: 'INVALID'
};

export class UpgradePackage {
    /**
     * @type {UpgradeFile[]}
     * @private
     */
    _files = [];
    _log = SystemController.getLogger('UpgradePackage');
    /**
     * @type {boolean}
     * @private
     */
    _validated = false;
    /**
     * @type {String}
     * @private
     */
    _state = STATE.INVALID;
    /**
     *
     * @type {ManifestFile}
     * @private
     */
    _manifest = null;

    /**
     * @param {ManifestFile} packageManifest
     */
    constructor(packageManifest) {
        this._manifest = packageManifest;

        let upgradeDir = `${shell.pwd()}/version`;
        let packageDir = `${upgradeDir}/${this._manifest.name}.${this._manifest.version}`;
        this._log.info(`Searching for package files in Upgrade directory`);
        shell.ls(`${packageDir}/*.json`).forEach(file => {
            let typeMap = {
                'core_collection': CollectionFile,
                'core_collection_field_type': FieldTypeFile,
                'core_manifest': ManifestFile
            };
            const genericType = new UpgradeFile(file);
            const detailedType = typeMap[genericType.json._metadata.collection_name];
            if (detailedType)
                this._files.push(new detailedType(file));
            else
                this._files.push(genericType);
        });
        this._log.debug(`Found ${this._files.length} files to install:`);
        if (!this._files)
            throw(`Unable to read directory: ${packageDir}`);
    }

    /**
     * @param {String} filePath
     * @returns {UpgradeFile}
     */
    getTypedFile(filePath) {
    }

    /**
     * @param {String} fileName
     * @returns {UpgradePackage}
     */
    static getFromFile(fileName) {
        let upgradeDir = `${shell.pwd()}/version`;
        let manifestFiles = shell.ls(`${upgradeDir}/${fileName}`).reduce((acc, fileName) => {
            if (fileName.startsWith('core_manifest')) {
                acc.push(fileName)
            }
            return acc;
        }, []);
        if (manifestFiles.length === 1) {
            let manifest = new ManifestFile(`${upgradeDir}/${fileName}/${manifestFiles[0]}`);
            return new UpgradePackage(manifest);
        }

        return null;
    }

    /**
     * @param {String} packageName
     * @param {String} version
     * @returns {UpgradePackage}
     */
    static getFromDatabase(packageName, version) {
        // TODO
    }

    /**
     * @returns {Promise<boolean>}
     */
    async validate() {
        let invalidFiles = [];
        this._log.debug(`Checking validity of files for this upgrade package...`);
        this._files.forEach(file => {
            if (!file.checkValidity()) {
                this._state = STATE.INVALID;
                invalidFiles.push(file);
            }
        });
        this._validated = true;
        return invalidFiles.length === 0;
    }

    /**
     * @returns {Promise<void>}
     */
    async install() {
        if (!this._validated)
            await this.validate();

        if (!this._state == STATE.VALID) {
            let err = new Error();
            this._log.error(`Package does not seem to be valid, cannot continue installation`, err);
            throw err;
        }

        try {
            this._log.info(`Installing ${this._manifest.name} version: ${this._manifest.version}`);
            this._log.info(`Discovering new field types for package ${this._manifest.name}`);
            await this._installFieldTypes();
            this._log.info(`Upgrading Schema for for package ${this._manifest.name}`);
            await this._upgradeCollections();
            this._log.info(`Loading remaining files for package ${this._manifest.name}`);
            await this._loadGenericFiles();
            this._log.info(`Loading manifest files for package ${this._manifest.name}`);
            await this._installManifests();
        } catch (err) {
            this._log.error(`Unable to load plugin files to system, critical error`, err);
            throw err;
        }
    }

    /**
     * @returns {Promise<*>}
     * @private
     */
    async _installFieldTypes() {
        let files = await this._filterFilesForLoading('core_collection_field_type');
        this._log.info(`Found ${files.length} field types to check for plugin`);
        let promises = files.map(async (fieldTypeFile) => {
            return fieldTypeFile.bootFile();
        });
        return Promise.all(promises);
    }

    /**
     * @returns {Promise<*>}
     * @private
     */
    async _installManifests() {
        let files = await this._filterFilesForLoading('core_manifest');
        this._log.info(`Found ${files.length} manifests to check for plugin`);
        let promises = files.map(async (manifestFile) => {
            return manifestFile.bootFile();
        });
        return Promise.all(promises);
    }

    /**
     * @returns {Promise<void>}
     * @private
     */
    async _upgradeCollections() {
        try {
            this._log.info(`Upgrading Collections...`);
            let files = await this._filterFilesForLoading('core_collection');
            this._log.info(`Found ${files.length} collections to check for plugin`);
            let promises = files.map(async (collectionFile) => {
                this._log.info(`Executing collection file ${collectionFile.fileName}...`);
                await collectionFile.bootFile();
                this._log.info(`Successfully upgraded collection file ${collectionFile.fileName}...`);
            });

            await Promise.all(promises);
            this._log.info(`Finished upgrading collections`);
        } catch (error) {
            this._log.error(`Unable to upgrade collections for Plugin: ${this._manifest.name}.${this._manifest.version}`, error);
            throw error;
        }
    }

    /**
     * @returns {Promise<*>}
     * @private
     */
    async _loadGenericFiles() {
        this._log.info(`${this._files.length} remaining files to check for plugin`);
        let promises = this._files.map(async (upgradeFile) => {
            try {
                await upgradeFile.bootFile();
            } catch (error) {
                this._log.error(`Unable to load file: ${upgradeFile.sourceFilePath}`, error);
                throw(error);
            }
        });
        return Promise.all(promises);
    }

    /**
     * @param requestedType
     * @returns {Promise<Array>}
     * @private
     */
    async _filterFilesForLoading(requestedType) {
        let requestedFiles = [];
        let i = this._files.length;
        while (i--) {
            if (this._files[i].type == requestedType) {
                requestedFiles.push(this._files[i]);
                this._files.splice(i, 1);
            }
        }
        return requestedFiles;
    }

    /**
     * @param {ManifestFile} manifest
     * @returns {Promise<boolean>}
     * @private
     */
    async _areDependenciesInstalled(manifest) {
        let manifests = await SystemController.getCollection('core_manifest');
        let uninstalledDependencies = [];

        await asyncForEach(this._manifest.dependencies, async dependency => {
            for (const moduleName in dependency) {
                if (!this.hasOwnProperty())
                    return;

                let dependencyInstalled = await manifests.find({
                    name: moduleName,
                    version: dependency[moduleName]
                });

                if (!dependencyInstalled)
                    uninstalledDependencies.push(`${moduleName}:${dependency[moduleName]}`);
            }
        });

        if (uninstalledDependencies.length)
            this._log.error(`Module dependencies [${uninstalledDependencies.join(', ')}] not installed, cannot install ${manifest.name}`);

        return uninstalledDependencies.length === 0;
    }
}