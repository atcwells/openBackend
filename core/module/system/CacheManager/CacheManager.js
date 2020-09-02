import {default as RedisStore} from "cache-manager-redis-store";
import {default as _CacheManager} from "cache-manager";
import {AbstractSystemModule} from "../AbstractSystemModule";
import {SystemController} from "../System/System.js";

export class CacheManager extends AbstractSystemModule {
    _cache;
    _log = SystemController.log.getLogger('CacheManager');

    constructor(options) {
        super(options);
    }

    startup() {
        this._log.info(`Configuring Cache [Redis] connection`);
        this._cache = _CacheManager.caching({
            store: RedisStore,
            host: 'localhost',
            port: 6000,
            auth_pass: '',
            db: 0,
            ttl: 600
        });
    }

    wrap(cacheKey, callback) {
        if (!this._cache)
            this.startup();
        return this._cache.wrap(cacheKey, callback);
    }

    get(key) {
        if (!this._cache)
            this.startup();
        return this._cache.get(key);
    }

    set(key, value) {
        if (!this._cache)
            this.startup();
        return this._cache.set(key, value);
    }

    deleteKey(key) {
        return this._cache.del(key);
    }
}