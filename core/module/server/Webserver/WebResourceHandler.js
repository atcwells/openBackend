import {WebContentType} from "./WebContentType";
import * as shell from "shelljs";
import * as fs from "fs";
import * as stream from "stream";
import {$ApplicationUserInterface} from "../../../apps/core_app_user_interface/$ApplicationUserInterface";
import {Logger} from "../../../system/logger/Logger";
import {$Resource} from "../../../apps/core_app_user_interface/$Resource";
import {sc} from "../../../../main";

export class WebResourceHandler {

    _staticResourceLocation = `${shell.pwd()}/src/core/public`;
    _resourceLocation = null;
    _resourceType = null;
    _resourceName = null;
    _contentType = null;

    constructor(urlParts) {
        this._log.debug(`new WebResource requested`);
        this._resourceType = urlParts[0];
        this._resourceName = urlParts[1];
        if (['resources'].indexOf(this._resourceType) == -1)
            throw new Error('Transaction does not seem to request a resource');

        this._contentType = WebContentType.determineContentType(this._resourceName);
        if (!this._contentType)
            this._log.error(`Resource content type cannot be determined!: ${urlParts}`, new Error('Resource content type not understood'));
    }

    async getContentType() {
        if (!this._contentType)
            return Promise.reject('No content type available');

        this._log.debug(`Content type for Resource request is: ${this._contentType.contentType}`);
        return Promise.resolve(this._contentType.contentType);
    }

    async getDependencies() {
        if (!this._resourceName.endsWith('.vue_app')) {
            return $Resource.findOne({
                'name': this._resourceName
            })
                .then((resource) => {
                    return resource.getValue('dependencies');
                })
                .catch((error) => {
                    return [];
                })
        }

        return Promise.resolve(null);
    }

    async getContent() {
        if (sc.environment.developer_mode) {
            this._log.debug(`Developer mode active, trying to send file from local machine: ${this._resourceName}`);
            let file = await this._attemptToSendLocalFile();
            if (file)
                return file;
        }

        if (!this._resourceName.endsWith('.vue_app') && !this._contentType)
            return Promise.reject('No content available');

        if (this._resourceName.endsWith('.vue_app')) {
            this._log.debug(`Building dynamic resource for ${this._resourceName}`);
            // let $ApplicationUserInterface = <any>sc.executionContext.get('$ApplicationUserInterface');
            let appUserInterface = await $ApplicationUserInterface.findOne({
                name: this._resourceName
            });
            this._log.debug(`Rendering dynamic component: ${appUserInterface.getId()}`);
            let renderedApplicationInterface = await appUserInterface.render();
            this._log.debug(`Returning ${this._resourceName} as dynamic resource`);
            return renderedApplicationInterface;

        } else {
            return $Resource.findOne({
                'name': this._resourceName
            })
                .then((resource) => {
                    this._log.debug(`Found resource: ${resource.getId()}`);
                    return resource.getValue('content');
                })
                .then((renderedIndex) => {
                    this._log.debug(`Returning ${this._resourceName} resource`);
                    return renderedIndex;
                })
                .catch((error) => {
                    this._log.debug(`Returning resource as stream for static file: ${this._resourceLocation}`);
                    return fs.readFileSync(`${this._resourceLocation}`);
                })
        }
    }

    async _attemptToSendLocalFile() {
        this._log.debug(`Attempting to send file from local machine`);
        this._resourceLocation = `${this._staticResourceLocation}${this._contentType.resourceLocation}/${this._resourceName}`;
        if (!shell.test('-e', this._resourceLocation)) {
            this._log.error(`Resource location cannot be found at: ${this._resourceLocation}`, new Error('Resource not found'));
            return;
        }

        if (!shell.test('-f', this._resourceLocation)) {
            this._log.error(`Resource is not a file at: ${this._resourceLocation}`, new Error('Resource not valid'));
            return;
        }

        this._log.debug(`Resource location determined at: ${this._resourceLocation}`);

        this._log.debug(`Returning resource as stream for static file: ${this._resourceLocation}`);
        return fs.readFileSync(`${this._resourceLocation}`);
    }

    _returnAsStream(resource) {
        let s = new stream.Readable();
        s.push(resource);
        s.push(null);
        return s;
    }
}