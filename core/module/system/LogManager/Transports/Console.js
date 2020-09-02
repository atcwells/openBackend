import {AbstractTransport} from "../AbstractTransport.js";

export class Console extends AbstractTransport {

    constructor(options) {
        super(options);
    }

    async writeLine(msg) {
        return console.log(msg.getString());
    }

    async writeError(err) {
        return console.log(err);
    }
}
