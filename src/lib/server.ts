import * as express from 'express';
import * as core from 'express-serve-static-core';
import * as http from 'http';
// @ts-ignore
import * as destroyable from 'server-destroy';
import { bindExpress as bindSentry, SentrySettings } from './monitoring/sentry';

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

type PromisedListen = (...args: Parameters<core.Express['listen']>) => Promise<http.Server>;
const patchListen = (app: core.Express) => (listen: core.Express['listen']): PromisedListen => {
    app.destroy = () => Promise.reject(new Error('Server did not start yet'));
    return (...args) => {
        return new Promise((resolve, reject) => {
            const server = listen(...args, (error?: Error) => {
                if (error) {
                    return reject(error);
                }
                destroyable(server);
                resolve(server);
            });
            app.destroy = async () => server.destroy();
        });
    };
};

type Unicore = core.Express & { listenAsync: PromisedListen };

export const createServer = (options?: ServerOptions): Unicore => {
    const app = express();
    app.startAt = new Date();
    bindSentry(app, options && options.sentry);
    const core = Object.assign(app, { listenAsync: patchListen(app)(app.listen.bind(app)) });
    return core;
};

export const createRouter = express.Router;
