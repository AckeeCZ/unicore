import * as composeMiddleware from 'compose-middleware';
import express from 'express';
import * as nodeHttp from 'http';

export type RouteHandler = express.Handler;

const compose = (...handlers: RouteHandler[]): RouteHandler => composeMiddleware.compose(...(handlers as any));

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

export { compose, customMethod };
