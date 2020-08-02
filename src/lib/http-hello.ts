import { getRequestServer, RouteHandler } from './http';
import { servers } from './http-server';
import http from 'http';

export default (): RouteHandler => (req: http.IncomingMessage, res: http.ServerResponse) => {
    const appInfo = {
        name: process.env.npm_package_name,
        version: process.env.npm_package_version,
    };
    const instance = servers.get(getRequestServer(req)!);
    res.end(JSON.stringify({
        '🦄': 'Greetings!',
        'Application I am running': appInfo,
        'My time is': new Date(),
        'I am online since': instance?.startAt,
    }));
};
