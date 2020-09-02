import * as base64 from "base-64";

export class Base64 {
    constructor() {

    }

    static encode(input) {
        return base64.encode(input)
    }

    static decode(input) {
        return base64.decode(input)
    }
}