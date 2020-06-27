import requestLib from 'got';
import * as http from '../lib/http';

export const request = (server: http.HttpServer) => {
    return requestLib.extend({
        prefixUrl: `http://localhost:${server.port}`,
    });
};
