import {AbstractSystemModule} from "../AbstractSystemModule.js";
import {default as readline} from "readline";
import {LogManager} from "../LogManager/LogManager.js";
import {SystemController as SystemControllerObj} from "./SystemController.js";
import {SystemInstaller} from "../Upgrade/SystemInstaller.js";

const STATE = {
    NOT_STARTED: 'NOT_STARTED',
    BOOTSTRAPPED: 'BOOTSTRAPPED',
    STARTING: 'STARTING',
    UPGRADE_REQUESTED: 'UPGRADE_REQUESTED',
    RUNNING: 'RUNNING',
    ERROR: 'ERROR'
};

const MODE = {
    OBE_DEVELOPER: "OBE_DEVELOPER",
    CUSTOM_DEVELOPER: "CUSTOM_DEVELOPER",
    TEST: "TEST",
    UAT: "UAT",
    PRODUCTION: "PRODUCTION"
};

export const SystemState = {
    state: STATE.NOT_STARTED,
    "isReady": () => {
        return this.toString() === STATE.RUNNING;
    }
};

/**
 * @global
 * @type {SystemController}
 */
export let SystemController = {};

export class System extends AbstractSystemModule {
    _log;
    mode = MODE.OBE_DEVELOPER;

    constructor(options) {
        super(options);
    }

    async bootstrap() {

        let _logManager = new LogManager(this.options.log_manager);
        await _logManager.startup();
        this._log = _logManager.getLogger('System');

        this._log.info(`Starting System Controller...`);
        SystemController = new SystemControllerObj(_logManager, this.options);
        await SystemController.startup();

        this._log.info(`System initializing at ${process.pid} with instance name: ${this.options.instance_name}`);

        SystemState.state = STATE.BOOTSTRAPPED;
        this._log.info('System Bootstrap completed.');
    }

    async startup() {
        SystemState.state = STATE.STARTING;
        try {
            await this._setupSystemKilledListener();

            if (this.mode === MODE.OBE_DEVELOPER) {
                this._log.info(`Clearing database and performing first time install...`);
                await this._performFirstTimeInstall();
            }

            if (this.mode === MODE.UPGRADE_REQUESTED) {
                this._log.info(`System upgrade found and requested, performing upgrade...`);
                await this._performSystemUpgade();
            }

            this._log.info(`Proceeding to start consumer nodes`);
            await this._startNodes();

        } catch (error) {
            this._log.error('System was unable to startup properly', error);
            return this.shutdown();
        }
        this._log.info(`System startup successful`);
        SystemState.state = STATE.RUNNING;
    }

    async shutdown() {
        this._log.info('System attempting graceful shutdown');
        try {
            await SystemController.shutdownAllModules();
            this._log.info('System exiting');
            process.exit();
        } catch (error) {
            this._log.error('System was unable to shutdown all components. Host may be unstable. Exiting...', error);
            throw new Error(error);
        }
    }

    async restart() {
        this._log.info('System restarting...');
        try {
            process.exit(0);
        } catch (ex) {
            this._log.error(`Failed to restart system`, error);
            throw new Error(ex);
        }
    }

    async _startNodes() {

    }

    async _performFirstTimeInstall() {
        let si = new SystemInstaller();
        await si.installInitiallyRequiredObjects();
        return await si.upgradeFromScratch();
    }


    async _performSystemUpgade() {

    }

    async _setupSystemKilledListener() {
        try {
            if (process.platform === 'win32') {
                readline
                    .createInterface({
                        input: process.stdin,
                        output: process.stdout
                    })
                    .on('SIGINT', function () {
                        process.emit('SIGINT');
                    });
            }

            process.on('SIGINT', () => {
                this._log.info(`Process received request to shutdown...`);
                process.exit();
            });
        } catch (error) {
            this._log.error(`Failed to setup System Kill Listener`, error);
            throw new Error(error)
        }
    }
}