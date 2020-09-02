import {Transaction} from "../Transaction/QueryString";
import {Engine} from "./Engine";

export class BusinessRuleEngine extends Engine {
    constructor() {
        super();
    }

    execute(t) {
        return t;
    }
}