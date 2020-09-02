import {CustomError} from "./CustomError.js";

let ConnectionFailure = class ConnectionFailure extends CustomError {
    constructor(message) {
        super(message);
        this.name = "ConnectionFailure";
    }
};

let ColumnCreationFailure = class ColumnCreationFailure extends CustomError {
    constructor(message) {
        super(message);
        this.name = "ColumnCreationFailure";
    }
};

export const DatabaseError = {
    ColumnCreationFailure,
    ConnectionFailure
};