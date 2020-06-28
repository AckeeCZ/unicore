import * as nodeHttp from 'http';
import * as http from './http';
import * as message from './message';

export type Controller<TAppRequest, TAppResponse> = (
    bizHandler: (request: TAppRequest) => TAppResponse
) => http.RouteHandler;

const createController = <
    THTTPRequest extends nodeHttp.IncomingMessage = nodeHttp.IncomingMessage,
    TAppRequest = any,
    TAppResponse = any,
    THTTPResponse extends nodeHttp.ServerResponse = nodeHttp.ServerResponse
>(
    parseRequest: (networkRequest: THTTPRequest) => TAppRequest,
    serializeResponse: (appResponse: TAppResponse, networkResponse: THTTPResponse) => void
) => {
    const controller: Controller<TAppRequest, TAppResponse> = (bizHandler) => {
        const handler: http.RouteHandler = async (req, res, cb) => {
            try {
                const result = await bizHandler(parseRequest(req as any));
                serializeResponse(result, res as any);
            } catch (error) {
                cb(error);
            }
        };
        return handler;
    };
    return controller;
};

export type ParseRequest = (httpRequest: nodeHttp.IncomingMessage) => message.Request<any>;
export type SerializeResponse = (appResponse: message.Response, httpResponse: nodeHttp.ServerResponse) => void;

const parseRequest: ParseRequest = (req): message.Request<typeof req> => {
    return {
        id: (req as any).id,
        data: (req as any).body,
        attributes: {
            ...req.headers,
            // Express route params
            ...(req as any).params,
            // Express query params
            ...(req as any).query,
        },
        originalRequest: req,
    };
};

const isFullResponse = (x: any): x is message.FullResponse => {
    return x && 'data' in x && 'attributes' in x;
};

const serializeResponse: SerializeResponse = async (appResponse, httpResponse) => {
    // httpResponse.statusCode = 200;
    httpResponse.setHeader('Content-Type', 'application/json');
    if (!appResponse) {
        httpResponse.end();
    } else if (typeof appResponse === 'string') {
        httpResponse.end(appResponse);
    } else if (isFullResponse(appResponse)) {
        Array.from(Object.entries(appResponse.attributes)).forEach(([name, value]) => {
            httpResponse.setHeader(name, String(value));
        });
        httpResponse.end(JSON.stringify(appResponse.data));
    } else {
        // Plain response
        httpResponse.end(JSON.stringify(appResponse));
    }
};

const controller = createController(parseRequest, serializeResponse);

export { createController, controller, parseRequest, serializeResponse };
