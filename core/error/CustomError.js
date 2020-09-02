export class CustomError extends Error {
    /**
     * @param {string} message
     * @param {number} [code = 0]
     */
    constructor(message, code = 0) {
        super();

        /**
         * @type {string}
         * @readonly
         */
        this.message = message;

        /**
         * @type {number}
         * @readonly
         */
        this.code = code;

        /**
         * @type {string}
         * @readonly
         */
        this.name = this.constructor.name;

        /**
         * @type {string}
         * @readonly
         */
        this.stack = CustomError.createStack(this);
    }

    /**
     * @return {string}
     */
    toString() {
        return this.getPrettyMessage();
    }

    /**
     * @return {string}
     */
    getPrettyMessage() {
        return `${this.message} Code: ${this.code}.`;
    }

    /**
     * @param {CustomError} error
     * @return {string}
     * @private
     */
    static createStack(error) {
        return (new Error(error)).stack;
    }
}