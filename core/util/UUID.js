import {default as uuid} from "uuid";

export class UUID {
    constructor() {

    }

    static encode(input) {
        return base64.encode(input)
    }

    static decode(input) {
        return base64.decode(input)
    }
}