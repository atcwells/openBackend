import {default as moment} from "moment"

export class Date {
    constructor() {
    }

    /**
     * Gets internationally recognised date
     * @returns {string}
     */
    static getCurrentDate(str) {
        const mom = moment();
        mom.utc();
        const year = mom.format('YYYY');
        const month = mom.format('MM');  // 0 to 11
        const day = mom.format('DD');
        return `${year}-${month}-${day}`;
    }

    /**
     * Gets standardized Log formatted date
     * @returns {string}
     */
    static getLogDate() {
        const mom = moment();
        mom.utc();
        const year = mom.format('YYYY');
        const month = mom.format('MM');  // 0 to 11
        const day = mom.format('DD');
        const hour = mom.format('HH');
        const minute = mom.format('mm');
        const second = mom.format('ss');
        const ms = mom.format('SSS');
        const ymd = year + '-' + month + '-' + day;
        const timestamp = `${hour}:${minute}:${second} (${ms})`;
        return ymd + ' ' + timestamp;
    }
}