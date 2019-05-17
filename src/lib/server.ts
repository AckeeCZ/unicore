import * as express from 'express';
import * as core from 'express-serve-static-core';
import { Omit } from 'lodash';
// @ts-ignore
import * as destroyable from 'server-destroy';
import { bindExpress as bindSentry, SentrySettings } from './monitoring/sentry';
import override from './util/override';

export interface ServerOptions {
    sentry?: SentrySettings;
}

declare module 'express-serve-static-core' {
    interface Extended {
        startAt: Date;
        destroy: () => Promise<void>;
    }
    // Override default App
    interface Express extends Extended {}
    // Override Request's App
    interface Application extends Extended {}
}

type PromisedListen = (...args: Parameters<core.Express['listen']>) => Promise<core.Express>;
const patchListen = (app: core.Express) => (listen: core.Express['listen']): PromisedListen => {
    app.destroy = () => Promise.reject(new Error('Server did not start yet'));
    return (...args) => {
        return new Promise((resolve, reject) => {
            const server = listen(
                ...args,
                // TODO: Fix types for the last arg
                // @ts-ignore
                error => {
                    if (error) {
                        return reject(error);
                    }
                    destroyable(server);
                    resolve(server);
                }
            );
            app.destroy = async () => server.destroy();
        });
    };
};

export const createServer = (options?: ServerOptions) => {
    const app = express();
    app.startAt = new Date();
    bindSentry(app, options && options.sentry);
    override(app, 'listen', patchListen(app));
    return (app as any) as ({ listen: PromisedListen } & Omit<typeof app, 'listen'>);
};

export const createRouter = express.Router;
