import {AbstractLogTransportComponent} from "../AbstractLogTransportComponent";
import {AbstractMessageModule} from "../AbstractMessageModule";

export class ConsoleWriter extends AbstractMessageModule {

    constructor(options) {
        super(options);
    }

    async startup() {
        return new Promise((resolve, reject) => {
            resolve();
        });
    }

    async shutdown() {
        return new Promise((resolve, reject) => {
            resolve();
        });
    }

    async restart() {
        return new Promise((resolve, reject) => {
            resolve();
        });
    }

    async writeLine(msg) {
        return new Promise((resolve, reject) => {
            console.log(msg.getString());
            resolve();
        });
    }

    async writeError(err) {
        return new Promise((resolve, reject) => {
            console.log(err);
            resolve();
        });
    }
}
