import { EventEmitter } from 'events';
import * as nodeHttp from 'http';
import * as errors from './http-error';
import * as routing from './http-routing';

export class HttpServerEmitter extends EventEmitter {}

export interface HttpServerOptions {
    beforeAll?: routing.RouteHandler;
    routes?: Record<string, routing.RouteHandler>;
    autoStartPort?: number;
}

export interface HttpServerEmitter extends EventEmitter {
    on(event: 'start', listener: () => void): this;
    on(event: 'error', listener: (error: errors.HttpError) => void): this;
    emit(event: 'error', error: errors.HttpError): boolean;
    emit(event: 'start'): boolean;
}

export interface HttpServer {
    // options: HttpServerOptions;
    startAt?: Date;
    // express: express.Application;
    server?: nodeHttp.Server;
    events: HttpServerEmitter;
    /**
     * Port number the server is running on.
     * Undefined if server haven't started.
     */
    port?: number;
}

const getRequestServer = (req: nodeHttp.IncomingMessage) => {
    return (req as any)[REQUEST_KEY_SERVER] as nodeHttp.Server | undefined;
};

const REQUEST_KEY_SERVER = Symbol.for('@unicore/server');

const createServer = (options?: HttpServerOptions) => {
    // const server: HttpServer = {
    //     options: {
    //         autoStartPort: options?.autoStartPort,
    //         beforeAll: options?.beforeAll,
    //         routes: options?.routes || {},
    //     },
    //     events: new HttpServerEmitter(),
    //     express: express(),
    // };
    // // Autostart on next tick to allow user to attach listeners before being emitted
    // process.nextTick(() => {
    //     if (server.options.autoStartPort !== undefined) {
    //         startServer(server, server.options.autoStartPort);
    //     }
    // });
    // // Bind server instance to all requests
    // server.express.use((req, _res, next) => {
    //     setRequestProp(req, REQUEST_KEY_SERVER, server);
    //     next();
    // });
    // if (server.options.beforeAll) {
    //     server.express.use(server.options.beforeAll);
    // }
    // // Assign all given routes
    // Array.from(Object.entries(server.options.routes!)).forEach(([route, handler]) => {
    //     // Dont `app.use` because it only checks if the start of the route matches
    //     server.express.all(route, handler);
    // });
    // // Assign default error handler
    // server.express.use(((error, req, res, _cb) => {
    //     server.events.emit('error', new errors.ServerRequestError(error, req, res));
    // }) as express.ErrorRequestHandler);
    // return server;
};

/**
 * HTTP server instances.
 * Instance is registered to the map once any operation like `startServer`
 * is made to it.
 **/
export const servers = new WeakMap<nodeHttp.Server, HttpServer>();

const register = (server: nodeHttp.Server) => {
    if (!servers.has(server)) {
        const instance: HttpServer = {
            server,
            events: new HttpServerEmitter(),
        }
        servers.set(server, instance);
    }
    return servers.get(server)!;
};

const startServer = async (server: nodeHttp.Server, port: number) => {
    await new Promise((resolve, reject) => {
        const instance = register(server);
        server.on('error', (error) => {
            if ((error as any).code === 'EADDRINUSE') {
                reject(error);
                server.close();
            }
        });
        server.listen(port, () => {
            // This should return always an object with `port` prop.
            // See https://nodejs.org/api/net.html#net_socket_address
            instance.port = (instance.server!.address() as any).port;
            instance.startAt = new Date();
            instance.events.emit('start');
            resolve();
        });
    });
};

const stopServer = async (server: nodeHttp.Server) => {
    const instance = servers.get(server);
    await new Promise((resolve, reject) => {
        if (!server.listening) {
            return resolve();
        }
        server.close((error) => {
            if (error) {
                reject(error);
            } else {
                if (instance) {
                    instance.server = undefined;
                    instance.startAt = undefined;
                }
                resolve();
            }
        });
    });
    return;
};

export { createServer, startServer, stopServer, getRequestServer };
