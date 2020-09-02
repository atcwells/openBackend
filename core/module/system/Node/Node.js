import {AbstractSystemModule} from "../AbstractSystemModule";

export class Node extends AbstractSystemModule {

    _process;
    online;
    pid;
    sessionIds = {};

    constructor(options) {
        super(options);
    }

    sendSync(msg, data) {
        return this._process.send(msg, data);
    }

    async startup() {

    }

    async shutdown() {
        return new Promise((resolve) => {
            resolve();
        })
    }

    async restart() {
        return new Promise((resolve) => {
            resolve();
        })
    }
}
