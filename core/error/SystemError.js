import {CustomError} from "./CustomError.js";

let SystemInstallationFailure = class SystemInstallationFailure extends CustomError {
    constructor(message) {
        super(message);
        this.name = "SystemInstallationFailure";
    }
};

export const SystemError = {
    SystemInstallationFailure
};