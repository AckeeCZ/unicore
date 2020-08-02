import http from 'http';
import { compose, route, startServer, stopServer, hello, RouteHandler, method, get, put, post, delete as del, getRequestParams, getQueryParams } from '../lib/http';
import { request } from './util';
import { format as sprintf } from 'util';

describe('HTTP - Routing', () => {
    const createServer = async (handler: http.RequestListener) => {
        const server = new http.Server(handler);
        await startServer(server, 0);
        return server;
    }
    describe('Hello', () => {
        const server = new http.Server(hello());
        beforeAll(async () => {
            await startServer(server, 0);
        });
        afterAll(async () => {
            await stopServer(server);
        });
        test('Says hello', async () => {
            const response = await request(server).get('');
            expect(response.statusCode).toEqual(200);
        });
    });
    describe('Basic methods have direct API support', () => {
        const respond: RouteHandler = (req, res) => {
            res.end(req.method);
        };
        let server: http.Server;
        afterEach(async () => {
            await stopServer(server);
        });
        test('GET', async() => {
            server = await createServer(get(respond));
            const response = await request(server)('api/v1/route', { method: 'GET' });
            expect(response.body).toEqual('GET');
            expect(response.statusCode).toEqual(200);
        });
        test('PUT', async() => {
            server = await createServer(put(respond));
            const response = await request(server)('api/v1/route', { method: 'PUT' });
            expect(response.body).toEqual('PUT');
            expect(response.statusCode).toEqual(200);
        });
        test('POST', async() => {
            server = await createServer(post(respond));
            const response = await request(server)('api/v1/route', { method: 'POST' });
            expect(response.body).toEqual('POST');
            expect(response.statusCode).toEqual(200);
        });
        test('DELETE', async() => {
            server = await createServer(del(respond));
            const response = await request(server)('api/v1/route', { method: 'DELETE' });
            expect(response.body).toEqual('DELETE');
            expect(response.statusCode).toEqual(200);
        });
    });
    describe('Any Node.js supported method can accessed via `method`', () => {
        const respond: RouteHandler = (req, res) => {
            res.end(req.method);
        };
        let server: http.Server;
        afterEach(async () => {
            await stopServer(server);
        });
        (Object.keys(method) as Array<keyof typeof method>)
            .forEach(m => {
                const onMethod = method[m];
                const methodName = m.toUpperCase();
                // These two methods behave strangely though and have no idea
                // what these do and how should behave. Yet.
                if (['CONNECT', 'MSEARCH'].includes(methodName)) {
                    return test.todo(methodName);
                }
                test(methodName, async () => {
                    server = await createServer(onMethod(respond));
                    const response = await request(server)('api/v1/route', { method: methodName as any });
                    // Some methods allow no body and are cut by Node.js
                    // automatically
                    if (!['HEAD'].includes(methodName)) {
                        expect(response.body).toEqual(methodName);
                    }
                    expect(response.statusCode).toEqual(200);
                });
            });
    });
    describe('Pathname routing', () => {
        const respond: RouteHandler = (req, res) => {
            res.end(req.url!);
        };
        let server: http.Server;
        afterEach(async () => {
            await stopServer(server);
        });
        test('Basic routing', async () => {
            server = await createServer(
                compose(
                    route('/api/v1/foo', respond),
                    route('/api/v1/bar', respond),
                )
            );
            {
                const response = await request(server)('api/v1/foo');
                expect(response.body).toEqual('/api/v1/foo');
                expect(response.statusCode).toEqual(200);
            }
            {
                const response = await request(server)('api/v1/bar');
                expect(response.body).toEqual('/api/v1/bar');
                expect(response.statusCode).toEqual(200);
            }
        });
    });
    describe('Method/Pathname routing', () => {
        const respond: RouteHandler = (req, res) => {
            res.end(sprintf('%s %s', req.method!, req.url!));
        };
        let server: http.Server;
        afterEach(async () => {
            await stopServer(server);
        });
        test('Basic routing', async () => {
            server = await createServer(
                compose(
                    route('/api/v1/foo', compose(get(respond), post(respond))),
                    route('/api/v1/bar', compose(get(respond), post(respond))),
                )
            );
            {
                const response = await request(server)('api/v1/foo', { method: 'GET' });
                expect(response.statusCode).toEqual(200);
                expect(response.body).toEqual('GET /api/v1/foo');
            }
            {
                const response = await request(server)('api/v1/foo', { method: 'POST' });
                expect(response.statusCode).toEqual(200);
                expect(response.body).toEqual('POST /api/v1/foo');
            }
            {
                const response = await request(server)('api/v1/bar', { method: 'POST' });
                expect(response.statusCode).toEqual(200);
                expect(response.body).toEqual('POST /api/v1/bar');
            }
            {
                const response = await request(server)('api/v1/bar', { method: 'GET' });
                expect(response.statusCode).toEqual(200);
                expect(response.body).toEqual('GET /api/v1/bar');
            }
        });
    });
    describe('Route parameters', () => {
        const respond: RouteHandler = (req, res) => {
            res.end(JSON.stringify(getRequestParams(req)));
        };
        let server: http.Server;
        afterEach(async () => {
            await stopServer(server);
        });
        test('Basic params', async () => {
            server = await createServer(route('/api/v1/foo/:fooID', respond));
            {
                const response = await request(server)('api/v1/foo/123', { method: 'GET', responseType: 'json' });
                expect(response.statusCode).toEqual(200);
                expect(response.body).toMatchObject({ fooID: '123' })
            }
        });
    });
    describe('Route query parameters', () => {
        const respond: RouteHandler = (req, res) => {
            res.end(JSON.stringify(getQueryParams(req)));
        };
        let server: http.Server;
        afterEach(async () => {
            await stopServer(server);
        });
        test('Basic params', async () => {
            server = await createServer(route('/api/v1/foo', respond));
            {
                const response = await request(server)('api/v1/foo?bar=true', { method: 'GET', responseType: 'json' });
                expect(response.statusCode).toEqual(200);
                expect(response.body).toMatchObject({ bar: 'true' })
            }
        });
    });
});
