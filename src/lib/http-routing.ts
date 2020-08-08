import * as nodeHttp from 'http';
import { match as matchPath } from 'path-to-regexp';
import { URL } from 'url';
import { format as sprintf } from 'util';

export type RouteHandler = nodeHttp.RequestListener;
export type AsyncRouteHandler = (req: nodeHttp.IncomingMessage, res: nodeHttp.ServerResponse) => Promise<void>;

const compose = (...handlers: RouteHandler[]): AsyncRouteHandler => {
    return async (req, res) => {
        for (const handler of handlers) {
            await handler(req, res);
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
const route = (routeString: string, handler: RouteHandler): RouteHandler => {
    const matcher = matchPath(routeString, { end: true, strict: false });
    return async (req, res) => {
        const url = new URL(req.url!, sprintf('http://%s', req.headers.host));
        const requestRouteString = url.pathname;
        const match = matcher(requestRouteString);
        if (!match) {
            return;
        }
        (req as any)[REQUEST_KEY_PARAMS] = match.params;
        (req as any)[REQUEST_KEY_QUERY_PARAMS] = Array.from(url.searchParams.entries()).reduce(
            (acc, pair) => ((acc[pair[0]] = pair[1]), acc),
            {} as any
        );
        return handler(req, res);
    };
};

// CustomMethod calls handler iff method is matched with the one in request
const customMethod = (methodName: string, handler: RouteHandler): RouteHandler => {
    if (!nodeHttp.METHODS.includes(methodName.toUpperCase())) {
        throw new Error(`Unsupported HTTP method: ${methodName}`);
    }
    return async (req, res) => {
        if (req.method !== methodName.toUpperCase()) {
            return;
        }
        return handler(req, res);
    };
};

export { compose, customMethod, route, getRequestParams, getQueryParams };
