import {$Collection} from "./$Collection.js";
import {DatabaseQueryOperator} from "./DatabaseQueryOperator.js";

export class AbstractCollection {
    _collection;
    _record;
    fields;

    constructor(collection) {
        this._collection = collection;
    }

    async create(params) {
        this._record = await this._collection.create(params);
        return this._record;
    }

    getCollectionInstance() {
        return $Collection.get(this._collection.getTableName(), 'name');
    }

    async update(params) {
        if (!this._record.update)
            this._record = await this._collection.findById(this._record.unique_id);

        let [affectedCount, affectedRows] = await this._record.update(params, {
            returning: true
        });
    }

    async findOne(params) {
        if (params.unique_id)
            return this.findById(params.unique_id);

        if (Object.keys(params).length == 1) {
            this._record = await this._collection.findOne(params);
        } else {
            this._record = await this._collection.findOne({
                [DatabaseQueryOperator.WHERE]: params
            });
        }
        return this._record;
    }

    async findById(id) {
        this._record = await this._collection.findById(id)
        return this._record;
    }

    async findAll(params) {
        return this._collection.findAll(params);
    }
}