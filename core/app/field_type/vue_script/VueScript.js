import {FieldType} from "../FieldType.js";

export class VueScript extends FieldType {

    constructor(value) {
        super(value);
    }

    get value() {
        // const script = new vm.Script(`(function() {
        //     return ${this._value}
        // })()`);
        // const context = vm.createContext({});
        // return script.runInContext(context);
        return this._value;
    }

    set value(value) {
        this._value = value;
    }
}