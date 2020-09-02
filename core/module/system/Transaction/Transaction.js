export class Transaction {
    _collection = null;
    _operation = null;
    _parameters = null;

    constructor() {

    }

    async execute() {

    }
}

export const Operation = {
    GET: 'GET',
    PUT: 'PUT',
    POST: 'POST',
    DELETE: 'DELETE'
};
