import {default as shell} from "shelljs";
import {default as _} from "lodash";
import {System} from "./core/module/system/System/System.js";

const applicationDefaultOptions = {
    "instance_name": "demo001",
    "mode": "OBE_DEVELOPER",
    "owner": "Dive",
    "cache_server": {
        "port": 6000
    },
    "cache_manager": {
        "host": "localhost",
        "port": 6000,
        "auth_pass": "",
        "db": 0,
        "ttl": 600
    },
    "database": {
        "port": 5432,
        "host": "localhost",
        "database_name": "test",
        "username": "alexwells",
        "password": "test_password"
    },
    "log_manager": {
        "max_buffer_length": 100,
        "log_transports": [
            {
                "name": "Console",
                "level": "Debug"
            },
            {
                "name": "File",
                "level": "Info",
                "filePath": "/log"
            }
        ]
    },
    "engines": []
};

(async function () {
    const obeOptions = await (async function () {
        const data = await shell.cat(shell.pwd() + '/package.json');
        let {obe_options} = JSON.parse(Buffer.from(data).toString());
        return _.merge(applicationDefaultOptions, obe_options);
    })();
    const system = new System(obeOptions);
    await system.bootstrap();
    await system.startup();
})();