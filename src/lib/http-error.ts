import * as nodeHttp from 'http';

class ServerError extends Error {
    constructor(error: Error) {
        super(error.message);
        this.name = 'ServerError';
        Error.captureStackTrace(this, ServerError);
    }
}

class ServerRequestError extends ServerError {
    public request: nodeHttp.IncomingMessage;
    public response: nodeHttp.ServerResponse;
    constructor(error: Error, request: nodeHttp.IncomingMessage, response: nodeHttp.ServerResponse) {
        super(error);
        this.request = request;
        this.response = response;
        this.name = 'ServerRequestError';
    }
}

export type HttpError = ServerError | ServerRequestError;

export { ServerRequestError, ServerError };
