import {createSecureServer, Http2Server, Http2ServerRequest, Http2Stream} from "http2";
import * as fs from "fs";
import * as shell from "shelljs";
import * as uuid from "uuid";
import {$WebTransaction} from "./$WebTransaction";
import {WebRequest} from "./WebRequest";
import {WebSessionEventHandler} from "./WebSessionEventHandler";
import {AbstractServerModule} from "../AbstractServerModule";

export class WebServer extends AbstractServerModule {
    _http2Server;
    _httpServer;
    unique_id;

    constructor(options) {
        super(options);
    }

    emitConnectionEventSync(data) {
        this._http2Server.emit('connection', data);
        this.unique_id = uuid.v4();
    }

    async startup() {
        this._log.info(`Starting WebServer...`);

        return new Promise((resolve) => {
            this._http2Server = createSecureServer({
                settings: {
                    enablePush: true
                },
                key: fs.readFileSync(`${shell.pwd()}/.cert/key.pem`),
                cert: fs.readFileSync(`${shell.pwd()}/.cert/cert.pem`),
            });
            let webSessionEventHandler = new WebSessionEventHandler();
            webSessionEventHandler.setup(this._http2Server);

            this._http2Server.on('session', (stream, headers) => {
                this._log.debug('A user started a session')
            });

            this._http2Server.on('stream', async (stream, headers) => {
                if (!!headers[':path']) {
                    return this.initiateTransaction(stream, headers);
                }
            });

            this._http2Server.on('request', async (request, headers) => {
                if (!!headers[':path']) {
                    request.addListener('close', () => {
                        console.log('died');
                    });
                    return this.initiateTransaction(request, headers);
                }
            });

            this._http2Server.on('error', (err) => console.error(err));

            this._http2Server.on('clientError', (err, socket) => {
                socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
            });

            this._http2Server.listen(8080, () => {
                this._log.info('WebServer started successfully');
                resolve();
            });
        })
            .catch((err) => {
                this._log.error(`Encountered error starting up Webserver`, err);
                throw err;
            })
    }

    async initiateTransaction(stream, headers) {
        let bodyJson = await WebRequest.getBody(headers[':method'], stream)
        let url = headers[':path'] || stream.url;
        let transaction = await $WebTransaction.create({
            url: url,
            body_json: bodyJson
        })
            .catch((err) => {
                this._log.error(`Encountered error with WebTransaction`, err);
                throw err;
            });

        this._log.info(`Sending Transaction with ID: ${transaction.getValue('unique_id')} - on ${process.pid}...`);
        await transaction.sendResponse(stream);
        this._log.info(`Transaction with ID: ${transaction.getValue('unique_id')} on ${process.pid} is complete`);
        return true;
    }

    async shutdown() {
        return new Promise((resolve, reject) => {
            this._http2Server.close(() => {
                resolve();
            })
        })
    }

    async restart() {
        return new Promise((resolve, reject) => {
            resolve();
        })
    }
}
