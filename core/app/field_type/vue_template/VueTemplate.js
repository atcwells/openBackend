import {FieldType} from "../FieldType.js";

export class VueTemplate extends FieldType {
    constructor(value) {
        super(value);
    }

    get value() {
        return this._value;
    }

    set value(value) {
        this._value = value;
    }
}