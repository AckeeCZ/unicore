import express from 'express';
import * as nodeHttp from 'http';
import { promisify } from 'util';

export type RouteHandler = express.Handler;

const compose = (...cbHandlers: RouteHandler[]): RouteHandler => {
    const handlers = cbHandlers.map((handler) => promisify(handler));
    return async (req, res, cb) => {
        try {
            for (const handler of handlers) {
                await handler(req, res);
            }
            cb();
        } catch (error) {
            cb(error);
        }
    };
};

const customMethod = (methodName: string, cbHandler: RouteHandler): RouteHandler => {
    if (!nodeHttp.METHODS.includes(methodName.toUpperCase())) {
        throw new Error(`Unsupported HTTP method: ${methodName}`);
    }
    const handler = promisify(cbHandler);
    return async (req, res, cb) => {
        if (req.method !== methodName.toUpperCase()) {
            return cb();
        }
        try {
            await handler(req, res);
            cb();
        } catch (error) {
            // TODO Guard cb passed to `handler` to prevent calling it twice
            // e.g. when handler calls cb(error), but crashes after
            cb(error);
        }
    };
};

export { compose, customMethod };
