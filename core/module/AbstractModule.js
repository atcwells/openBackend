export class AbstractModule {

    _log = null;

    constructor(options) {
        this.options = options;
    }

    async startup() {
        this._log.error('Abstract classes must not be called directly');
    }

    async shutdown() {
        this._log.error('Abstract classes must not be called directly');
    }

    async restart() {
        this._log.error('Abstract classes must not be called directly');
    }
}
