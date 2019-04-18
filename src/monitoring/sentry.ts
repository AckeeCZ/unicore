import { Application } from 'express';
import { CaptureOptions, Client } from 'raven';

export interface SentrySettings {
    dsn?: string;
}

declare module 'express-serve-static-core' {
    interface Application {
        sentry: {
            requestHandler: RequestHandler;
            errorHandler: ErrorRequestHandler;
            captureException: (error: Error, options?: CaptureOptions) => Promise<string>;
        };
    }
}

export const bindExpress = (app: Application, settings?: SentrySettings) => {
    if (!settings) {
        app.sentry = {
            requestHandler: (_req, _res, next) => next(),
            errorHandler: (error, _req, _res, next) => next(error),
            captureException: _error => Promise.resolve('Sentry disabled'),
        };
        return;
    }
    const raven: Client = require('raven');

    raven.config(settings.dsn).install();

    app.sentry = {
        requestHandler: () => raven.requestHandler(),
        errorHandler: () => raven.errorHandler(),
        captureException: (captureError, options) =>
            new Promise((resolve, reject) =>
                raven.captureException(captureError, { extra: options || {} }, (error, result) =>
                    error ? reject(error) : resolve(result)
                )
            ),
    };
};
