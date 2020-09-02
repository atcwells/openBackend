import {sc} from "../../../../main";

export class WebSessionEventHandler {

    _httpServer = null;

    constructor() {

    }

    setup(httpServer) {
        this._httpServer = httpServer;

        ['dive__record__updated',
            'dive__record__deleted',
            'dive__record__created'].forEach((eventName) => {
            sc.event.on(eventName, (params) => {
                let sessions = sc.session.getActiveSessions();
                for (let sessionId in sessions) {
                    let data = JSON.stringify({
                        message_id: eventName,
                        payload: params
                    });
                    sessions[sessionId].write(`event: message\n`);
                    sessions[sessionId].write(`data: ${data}\n\n`);
                }
            })
        });
    }
}