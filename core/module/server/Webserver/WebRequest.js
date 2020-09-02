import {constants} from "http2";

export class WebRequest {
    static TYPE = {
        INDEX: 'index',
        FAVICON: 'favicon',
        STATIC_RESOURCE: 'resource',
        APPLICATION: 'application',
        ROUTE: 'route',
        API: 'api',
        EVENT_STREAM: 'events'
    };

    static MAPPING = {
        'favicon.ico': WebRequest.TYPE.FAVICON,
        'resources': WebRequest.TYPE.STATIC_RESOURCE,
        'index': WebRequest.TYPE.INDEX,
        'api': WebRequest.TYPE.API,
        'app': WebRequest.TYPE.INDEX,
        '': WebRequest.TYPE.INDEX,
        '/': WebRequest.TYPE.INDEX,
        'event_stream': WebRequest.TYPE.EVENT_STREAM
    };

    determineType(URL) {
        let [firstSection] = URL.split('/').filter(Boolean);
        if (firstSection)
            return WebRequest.MAPPING[firstSection];

        return WebRequest.MAPPING[''];
    }

    static getBody(method, stream) {
        return new Promise((resolve, reject) => {
            let body = {};
            if (method !== constants.HTTP2_METHOD_GET && typeof method !== "undefined") {
                const chunks = [];
                stream.on('data', (chunk) => chunks.push(chunk));
                stream.on('end', () => {
                    const data = Buffer.concat(chunks);
                    body = JSON.parse(data.toString());
                    resolve(body);
                });
            } else {
                resolve(body);
            }
        })
            .catch((error) => {
                console.log(error);
            });
    }
}
