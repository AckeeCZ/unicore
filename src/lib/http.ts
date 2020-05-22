import * as composeMiddleware from 'compose-middleware';
import { EventEmitter } from 'events';
import express from 'express';
import * as nodeHttp from 'http';
import hello from './http-hello';
import * as method from './http-method';

const enableDestroy = require('server-destroy');

export type RouteHandler = express.Handler;

export interface HttpServerOptions {
    beforeEach?: RouteHandler;
    routes?: Record<string, RouteHandler>;
    autoStartPort?: number;
}

export interface HttpServerEmitter extends EventEmitter {
    on(event: 'start', listener: () => void): this;
    on(event: 'error', listener: (error: Error) => void): this;
    emit(event: 'error', error: Error): boolean;
    emit(event: 'start'): boolean;
}

export class HttpServerEmitter extends EventEmitter {}

export interface HttpServer {
    options: HttpServerOptions;
    startAt?: Date;
    express: express.Application;
    httpServer?: nodeHttp.Server;
    events: HttpServerEmitter;
}

const requestKey = {
    server: Symbol('server'),
};

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
        (req as any)[requestKey.server] = server;
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
                server.startAt = new Date();
                server.events.emit('start');
                resolve();
            }
        });
    });
};

const destroyServer = async (server: HttpServer) => {
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

const fromRequest = (req: Parameters<RouteHandler>[0], key: keyof typeof requestKey) => {
    switch (key) {
        case 'server':
            return (req as any)[requestKey.server] as HttpServer;
    }
};

const customMethod = (methodName: string, handler: RouteHandler): RouteHandler => {
    if (!nodeHttp.METHODS.includes(methodName.toUpperCase())) {
        throw new Error(`Unsupported HTTP method: ${methodName}`);
    }
    return (req, res, next) => {
        if (req.method !== methodName.toUpperCase()) {
            return next();
        }
        handler(req, res, next);
    };
};
const compose = (...handlers: RouteHandler[]): RouteHandler => composeMiddleware.compose(...(handlers as any));

const { post, get, put, delete: del, patch } = method;

export {
    compose,
    createServer,
    destroyServer,
    fromRequest,
    hello,
    startServer,
    customMethod,
    method,
    post,
    get,
    put,
    del as delete,
    patch,
};
