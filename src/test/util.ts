import requestLib from 'got';
import http from 'http';
import { servers } from '../lib/http-server';

export const request = (server: http.Server) => {
    return requestLib.extend({
        prefixUrl: `http://localhost:${servers.get(server)?.port!}`,
        throwHttpErrors: false,
    });
};
