import {default as RedisServer} from "redis-server";
import {AbstractSystemModule} from "../AbstractSystemModule.js";
import {SystemController} from "../System/System.js";

export class CacheServer extends AbstractSystemModule {
    _redisServer;
    _port;

    constructor(options) {
        super(options);
        this._port = options.port;
        this._log = SystemController.getLogger('CacheServer');
    }

    async startup() {
        this._log.info(`Starting Redis server at ${this._port}...`);
        this._redisServer = new RedisServer(this._port);

        return new Promise((resolve, reject) => {
            this._redisServer.open((err) => {
                if (err === null) {
                    // You may now connect a client to the Redis
                    // server bound to port 6379.
                    resolve();
                } else {
                    reject(err);
                }
            });
        });
    }

    async shutdown() {

    }

    async restart() {

    }
}