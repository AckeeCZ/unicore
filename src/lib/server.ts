import express from 'express';
import * as core from 'express-serve-static-core';
import { Omit } from 'lodash';
import { bindExpress as bindSentry, SentrySettings } from 'monitoring/sentry';
import override from './util/override';

export interface ServerOptions {
    sentry?: SentrySettings;
}

declare module 'express-serve-static-core' {
    interface Extended {
        startAt: Date;
    }
    // Override default App
    interface Express extends Extended {}
    // Override Request's App
    interface Application extends Extended {}
}

type PromisedListen = (...args: Parameters<core.Express['listen']>) => Promise<core.Express>;
const patchListen = (app: core.Express) => (listen: core.Express['listen']): PromisedListen => {
    return (...args) => {
        return new Promise((resolve, reject) => {
            listen(
                ...args,
                // TODO: Fix types for the last arg
                // @ts-ignore
                error => (error ? reject(error) : resolve(app))
            );
        });
    };
};

export const createServer = (options?: ServerOptions) => {
    const app = express();
    app.startAt = new Date();
    bindSentry(app, options ? options.sentry : {});
    override(app, 'listen', patchListen(app));
    return (app as any) as ({ listen: PromisedListen } & Omit<typeof app, 'listen'>);
};

export const createRouter = express.Router;
