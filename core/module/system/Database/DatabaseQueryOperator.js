export class DatabaseQueryOperator {
    static OP = {
        //  soon 'and': { op: '$and', val: defaultValue },
        //  soon 'or': { op: '$or', val: defaultValue },
        'gt': {
            op: '$gt',
            text: 'GT'
        },
        'gte': {
            op: '$gte',
            text: 'GTE'
        },
        'lt': {
            op: '$lt',
            text: 'LT'
        },
        'lte': {
            op: '$lte',
            text: 'LTE'
        },
        'ne': {
            op: '$ne',
            text: 'NE'
        },
        'eq': {
            op: '$eq',
            text: 'EQ'
        },
        'not': {
            op: '$not',
            text: 'NOT'
        },
        // soon 'between': { op: '$between', val: defaultValue },
        // soon 'notBetween': { op: '$notBetween', val: defaultValue },
        'or': {
            op: '$or',
            text: 'OR'
        },
        'in': {
            op: '$in',
            text: 'IN'
        },
        'notIn': {
            op: '$notIn',
            text: 'NOTIN'
        },
        'like': {
            op: '$like',
            text: 'LIKE'
        },
        'notLike': {
            op: '$notLike',
            text: 'CONTAINS'
        },
        'iLike': {op: '$iLike'},
        'notILike': {op: '$notILike'},
        'overlap': {op: '$overlap'},
        'contains': {
            op: '$contains',
            text: 'CONTAINS'
        },
        'contained': {op: '$contained'}
    };

    static WHERE = 'where'
}