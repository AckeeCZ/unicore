import { EventEmitter } from 'events';
import express from 'express';
import * as nodeHttp from 'http';
import * as routing from './http-routing';

const enableDestroy = require('server-destroy');

export class HttpServerEmitter extends EventEmitter {}

export interface HttpServerOptions {
    beforeEach?: routing.RouteHandler;
    routes?: Record<string, routing.RouteHandler>;
    autoStartPort?: number;
}

export interface HttpServerEmitter extends EventEmitter {
    on(event: 'start', listener: () => void): this;
    on(event: 'error', listener: (error: Error) => void): this;
    emit(event: 'error', error: Error): boolean;
    emit(event: 'start'): boolean;
}

export interface HttpServer {
    options: HttpServerOptions;
    startAt?: Date;
    express: express.Application;
    httpServer?: nodeHttp.Server;
    events: HttpServerEmitter;
    /**
     * Port number the server is running on.
     * Undefined if server haven't started.
     */
    port?: number;
}

const setRequestProp = (req: nodeHttp.IncomingMessage, name: string | symbol, value: any) => {
    (req as any)[name] = value;
};
const getRequestProp = (req: nodeHttp.IncomingMessage, name: string | symbol) => {
    return (req as any)[name];
};
const getRequestServer = (req: nodeHttp.IncomingMessage) => {
    return getRequestProp(req, REQUEST_KEY_SERVER) as HttpServer;
};

const REQUEST_KEY_SERVER = Symbol.for('@unicore/server');

const createServer = (options?: HttpServerOptions) => {
    const server: HttpServer = {
        options: {
            autoStartPort: options?.autoStartPort,
            beforeEach: options?.beforeEach,
            routes: options?.routes || {},
        },
        events: new HttpServerEmitter(),
        express: express(),
    };
    // Autostart on next tick to allow user to attach listeners before being emitted
    process.nextTick(() => {
        if (server.options.autoStartPort !== undefined) {
            startServer(server, server.options.autoStartPort);
        }
    });
    // Bind server instance to all requests
    server.express.use((req, _res, next) => {
        setRequestProp(req, REQUEST_KEY_SERVER, server);
        next();
    });
    // Assign all given routes
    Array.from(Object.entries(server.options.routes!)).forEach(([route, handler]) => {
        // Dont `app.use` because it only checks if the start of the route matches
        server.express.all(route, handler);
    });
    return server;
};

const startServer = async (server: HttpServer, port: number) => {
    await new Promise((resolve, reject) => {
        server.httpServer = server.express.listen(port, (error) => {
            if (error) {
                server.events.emit('error', error);
                reject(error);
            } else {
                enableDestroy(server.httpServer);
                // This should return always an object with `port` prop.
                // See https://nodejs.org/api/net.html#net_socket_address
                server.port = (server.httpServer!.address() as any).port;
                server.startAt = new Date();
                server.events.emit('start');
                resolve();
            }
        });
    });
};

const stopServer = async (server: HttpServer) => {
    if (!server.httpServer) {
        return;
    }
    await new Promise((resolve, reject) =>
        (server.httpServer! as any).destroy((error: Error) => {
            error ? reject(error) : resolve();
        })
    );
    server.httpServer = undefined;
    server.startAt = undefined;
    return;
};

export { createServer, startServer, stopServer, getRequestServer };
