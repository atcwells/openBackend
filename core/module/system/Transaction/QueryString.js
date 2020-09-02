import {DatabaseQueryOperator} from "../../components/system/database/DatabaseQueryOperator";

export class QueryString {
    _queryString;
    _sequelizeQuery;

    constructor(query) {
        this._queryString = query;
    }

    buildSequelizeQuery(queryString) {
        let queryOb = {};
        let queryParts = queryString.split(';');
        // gives distinct query sections
        if (queryParts.length > 1)
            queryOb['OR'] = [];

        queryParts.forEach(section => {
            let newQueryObj = {};
            let majorParts = section.split('OR');
            let part = majorParts.shift();
            if (part === "") {
                newQueryObj['OR'] = [];
            } else {

            }
        });
        return queryOb;
    }

    _analyzeQueryPart(queryPart) {
        if (queryPart == '')
            return {
                'OR': []
            };

        if (queryPart.split('OR').length === 0) {

        }
    }

    buildQueryString(sequelizeQueryObject) {
        let queryParts = [];
        for (let columnName in sequelizeQueryObject) {
            let newQueryPart = '' + columnName;
            if (typeof sequelizeQueryObject[columnName] === "string") {
                newQueryPart += DatabaseQueryOperator.OP.eq.text + sequelizeQueryObject[columnName]
            } else {

                // let operator = DatabaseQueryOperator.OP[]
                // newQueryPart += DatabaseQueryOperator
            }
        }
        return queryParts.join('AND');
    }
}

//active=true
// ^assigned_to.building.nameSTARTSWITHxyz
// ^ORassigned_to.building.nameINa,b,c
// ^NQapproval=approved
// ^caused_by=46cc713aa9fe1981008a95d213681c65


// activeIStrue
// ANDassigned_to.building.nameSTARTSWITHxyz
// ORassigned_to.building.nameINa,b,c;
// approval=approved
// ANDcaused_by=46cc713aa9fe1981008a95d213681c65

// active=true^cmdb_ci_business_app.=xyz^ORdescription=abc^assigned_to=c2826bf03710200044e0bfc8bcbe5d45

// active=true^cmdb_ci_business_app.apm_application_profile.sys_domain.cost_center.location.contact.company=0c43f457c611227500002515d8ee0e38^ORdescription=abc^assigned_to=c2826bf03710200044e0bfc8bcbe5d45^RLQUERYsysapproval_approver.sysapproval,>=1,m2m^approver=c2826bf03710200044e0bfc8bcbe5d45^ENDRLQUERY

// activeIStrueANDassigned_to.building.nameSTARTSWITHxyzORassigned_to.building.nameINa,b,c;approval=approvedANDcaused_by=46cc713aa9fe1981008a95d213681c65
//
// let x = {
//     'OR': [{
//         'active': 'true',
//         'OR': [{
//             'assigned_to.building.name': {
//                 'STARTSWITH': 'xyz'
//             }
//         }, {
//             'assigned_to.building.name': {
//                 'IN': ['a', 'b', 'c']
//             }
//         }]
//     }, {
//         'approval': 'approved',
//         'caused_by': '46cc713aa9fe1981008a95d213681c65'
//     }]
// };

/*
submit (buildQueryString):
authorId: {
  [Op.or]: [12, 13]
}

should receive:

'author_id:IS:12,13

authorId: 12

should receive:

'authorId:IS=12
*/

/*
submit (buildSequelizeQuery):
'authorId:IS

should receive:
authorId: {
  [Op.or]: [12, 13]
}

*/

/*
valid query string chars:

ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~:/?#[]@!$&'()*+,;=
*/