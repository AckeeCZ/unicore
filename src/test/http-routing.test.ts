import { http } from '../lib';
import { request } from './util';

describe('HTTP - Routing', () => {
    describe('Hello', () => {
        const server = http.createServer({
            routes: {
                '/': http.hello(),
            },
        });
        beforeAll(async () => {
            await http.startServer(server, 0);
        });
        afterAll(async () => {
            await http.stopServer(server);
        });
        it('Says hello', async () => {
            const response = await request(server).get('');
            expect(response.statusCode).toEqual(200);
        });
    });
    describe('Basic methods have direct API support', () => {
        const respond: http.RouteHandler = (req, res) => {
            res.end(req.method);
        };
        const server = http.createServer({
            routes: {
                '/get': http.get(respond),
                '/post': http.post(respond),
                '/delete': http.delete(respond),
                '/put': http.put(respond),
                '/patch': http.patch(respond),
            },
        });
        beforeAll(async () => {
            await http.startServer(server, 0);
        });
        afterAll(async () => {
            await http.stopServer(server);
        });
        ['get', 'post', 'delete', 'put', 'patch'].forEach((method) => {
            test(`HTTP ${method}`, async () => {
                const response = await request(server)(method, { method: method as any });
                expect(response.body).toEqual(method.toUpperCase());
                expect(response.statusCode).toEqual(200);
            });
        });
    });
    describe('Any Node.js supported method can be defined via `method`', () => {
        const respond: http.RouteHandler = (req, res) => {
            res.end(req.method);
        };
        const server = http.createServer({
            routes: {
                // http.method.* contains all methods supported by Node.js
                // Trace for example:
                '/': http.method.trace(respond),
                '/patch': http.customMethod('patch', respond),
            },
        });
        beforeAll(async () => {
            await http.startServer(server, 0);
        });
        afterAll(async () => {
            await http.stopServer(server);
        });
        test('HTTP trace', async () => {
            const response = await request(server)({ method: 'trace' });
            expect(response.body).toEqual('TRACE');
            expect(response.statusCode).toEqual(200);
        });
        test('HTTP patch', async () => {
            const response = await request(server)('patch', { method: 'patch' });
            expect(response.body).toEqual('PATCH');
            expect(response.statusCode).toEqual(200);
        });
    });
    describe('Multiple methods per route', () => {
        const respond = (response: string): http.RouteHandler => (_req, res) => {
            res.end(response);
        };
        const server = http.createServer({
            routes: {
                '/': http.compose(http.get(respond('GET1')), http.post(respond('POST')), http.get(respond('GET2'))),
                '/fallthrough': http.compose(
                    http.get((_req, res, next) => (res.write('1'), next())),
                    (_req, res, next) => (res.write('2'), next()),
                    (_req, res) => res.end('3')
                ),
            },
        });
        beforeAll(async () => {
            await http.startServer(server, 0);
        });
        afterAll(async () => {
            await http.stopServer(server);
        });
        test('first method handler responds - no auto fall through', async () => {
            const response = await request(server)({ method: 'GET' });
            expect(response.body).toEqual('GET1');
            expect(response.statusCode).toEqual(200);
        });
        test('another method also works', async () => {
            const response = await request(server)({ method: 'POST' });
            expect(response.body).toEqual('POST');
            expect(response.statusCode).toEqual(200);
        });
        test('chaning via next is possible - defined by the handler', async () => {
            {
                const response = await request(server)('fallthrough');
                expect(response.body).toEqual('123');
                expect(response.statusCode).toEqual(200);
            }
            {
                const response = await request(server).post('fallthrough');
                expect(response.body).toEqual('23');
                expect(response.statusCode).toEqual(200);
            }
        });
    });
});
