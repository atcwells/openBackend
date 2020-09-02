import {UpgradeFile} from "./UpgradeFile.js";
import {SystemController} from "../System/System.js";

export class ManifestFile extends UpgradeFile {
    _log = SystemController.getLogger('ManifestFile');
    version = "0.0.0";
    dependencies = [];
    type = "core_manifest";

    /**
     * @param {String} filePath
     */
    constructor(filePath) {
        super(filePath);
        this.version = this.json.version;
        for (const key in this.json.dependencies) {
            this.dependencies.push({
                [key]: this.json.dependencies[key].version
            })
        }

        this.name = this.json.name;
    }
}