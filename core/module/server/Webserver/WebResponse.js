import {$AppAPI} from "../../../system/transaction/$AppAPI";
import {Logger} from "../../../system/logger/Logger";
import {constants} from "http2";

export class WebResponse {

    async makeAPIRequest(targetClass, targetAction, params) {
        console.log('*****');
        console.log(targetClass);
        console.log(targetAction);
        console.log('*****');
        return $AppAPI.findOne({
            name: targetClass
        })
            .then((apiInstance) => {
                return apiInstance.executeMethod(targetAction, params);
            })
            .then((result) => {
                return {
                    [constants.HTTP2_HEADER_CONTENT_TYPE]: 'application/json',
                    [constants.HTTP2_HEADER_STATUS]: constants.HTTP_STATUS_OK,
                    result: JSON.stringify(result)
                };
            })
            .catch((error) => {
                this._log.error('Encountered an error attempting to process API call', error);
                throw (error);
            });
    }

    async sendResource() {

    }
}