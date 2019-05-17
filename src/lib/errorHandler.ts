import { ErrorRequestHandler } from 'express';

const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
    res.status(error.status || 500);
    const serializedError = error.toJSON
        ? { error: error.toJSON() }
        : { error: { ...error, message: error.message, stack: error.stack } };
    // ⚠
    (res as any).out = serializedError;
    res.json(serializedError);
};

export default errorHandler;
