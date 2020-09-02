import {AbstractSystemModule} from "../AbstractSystemModule.js";
import {SystemController} from "../System/System.js";

export class ModuleManager extends AbstractSystemModule {
    _log;
    _modules = {};
    _activeModules = {};

    constructor(options) {
        super(options);
    }

    async startup() {
        this._log = SystemController.getLogger('ModuleManager');
    }

    async registerComponent(component, name, type) {
        return new Promise(resolve => {
            this._modules[name] = component;
            resolve();
        }).catch(() => {
            this._log.info(`System was unable to register component: ${name}`);
        });
    }

    async registerComponents(components, type) {
        return Promise.all(
            components.map(
                component =>
                    this.registerComponent(component.object, component.name, component.type)
            )
        );
    }

    instantiateComponent(componentName, options) {
        this._log.debug(`Trying to instantiate ${componentName}...`);
        if (!this._modules[componentName]) {
            this._log.error(`Unable to instantiate ${componentName} because it does not exist`, new Error());
        } else {
            try {
                let component = ComponentRegistry._instantiate(this._modules[componentName], options);
                this._log.debug(`Succeeded in instantiating ${componentName}`);
                this._activeModules[componentName] = component;
                return component;
            } catch (e) {
                this._log.error(`Unable to instantiate ${componentName}, something went wrong during initialization`, new Error());
            }
        }
        return null;
    }

    async shutdownAllComponents() {
        this._log.info('Shutting down System components...');
        return new Promise(resolve => {
            //TODO implement
            this._log.info('System components shut down');
            resolve();
        }).catch(() => {
            this._log.info(`System was unable to register component: ${name}`);
        });
    }
}
