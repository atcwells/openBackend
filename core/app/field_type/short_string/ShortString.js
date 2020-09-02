import {FieldType} from "../FieldType.js";

export class ShortString extends FieldType {

    constructor(value) {
        super(string);
    }

    get value() {
        return this._value;
    }

    set value(value) {
        this._value = value;
    }
}