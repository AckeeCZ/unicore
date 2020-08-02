import * as nodeHttp from 'http';
import { promisify, format as sprintf } from 'util';
import { match as matchPath } from 'path-to-regexp';
import { URL } from 'url';

export type RouteHandler = nodeHttp.RequestListener
export type AsyncRouteHandler = (req: nodeHttp.IncomingMessage, res: nodeHttp.ServerResponse, cb: (error?: Error) => void) => void;

const compose = (...cbHandlers: AsyncRouteHandler[]): RouteHandler => {
    const handlers = cbHandlers.map((handler) => promisify(handler));
    return async (req, res) => {
        try {
            for (const handler of handlers) {
                await handler(req, res);
            }
        } catch (error) {
            // TODO: Error
        }
    };
};

const REQUEST_KEY_PARAMS = Symbol.for('@unicore/params');
const REQUEST_KEY_QUERY_PARAMS = Symbol.for('@unicore/queryParams');

const getRequestParams = <T extends {} = Record<string | number | symbol, any>>(req: nodeHttp.IncomingMessage) => {
    return (req as any)[REQUEST_KEY_PARAMS] as T;
};
const getQueryParams = <T extends {} = Record<string | number | symbol, any>>(req: nodeHttp.IncomingMessage) => {
    return (req as any)[REQUEST_KEY_QUERY_PARAMS] as T;
};

// Route call handler iff Route string is matched with the one in request
//  - parses route params like /foo/:id
//  - parses query params like /foo?bar=true
const route = (routeString: string, handler: AsyncRouteHandler): RouteHandler => {
    const matcher = matchPath(routeString, { end: true, strict: false });
    const requestHandler: AsyncRouteHandler = async (req, res, cb?) => {
        const url = new URL(req.url!, sprintf('http://%s', req.headers.host));
        const requestRouteString = url.pathname;
        const match = matcher(requestRouteString);
        if (!match) {
            return cb && cb();
        }
        (req as any)[REQUEST_KEY_PARAMS] = match.params;
        (req as any)[REQUEST_KEY_QUERY_PARAMS] = Array.from(url.searchParams.entries())
            .reduce((acc, pair) => (acc[pair[0]] = pair[1], acc), {} as any);
        handler(req, res, cb);
    };
    // TODO Same as with custom method return override :/
    return requestHandler as RouteHandler;
};

// CustomMethod calls handler iff method is matched with the one in request
const customMethod = (methodName: string, cbHandler: RouteHandler) => {
    if (!nodeHttp.METHODS.includes(methodName.toUpperCase())) {
        throw new Error(`Unsupported HTTP method: ${methodName}`);
    }
    const handler = promisify(cbHandler);
    const requestHandler: AsyncRouteHandler = async (req, res, cb) => {
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
    // To allow this pass to native Node.js server as a listener
    return requestHandler as RouteHandler;
};

export { compose, customMethod, route, getRequestParams, getQueryParams };
