import * as bodyParser from 'body-parser';
import http from 'http';
import * as TodoApp from './http-todoapp';
import { request } from './util';
import { createController, parseRequest, serializeResponse, get, route, compose, controller, post, delete as del, put, startServer, stopServer } from '../lib/http';

describe('HTTP JSON CRUD', () => {
    const controller = createController(
        (req): TodoApp.AuthenticatedRequest => ({ ...parseRequest(req), user: (req as any).user }),
        serializeResponse
    );
    const server = new http.Server(
        compose(
            TodoApp.mw.generateRequestID,
            bodyParser.json(),
            route('/todos', compose(
                get(controller(TodoApp.listTodo)),
                post(controller(TodoApp.createTodo)),
            )),
            route('/todos/:todoID', compose(
                del(controller(TodoApp.deleteTodo)),
                get(controller(TodoApp.getTodo)),
                put(controller(TodoApp.updateTodo)),
            )),
            route('/me', compose(
                TodoApp.mw.authentication,
                get(controller(TodoApp.getSessionUser)),
            ))
        )
    );
    // server.events.on('error', (error) => {
    //     if (!('request' in error)) {
    //         return;
    //     }
    //     const { request, response } = error;
    //     response.statusCode = 500;
    //     http.serializeResponse(
    //         {
    //             data: { error: 'Server error' },
    //             attributes: { 'x-request-id': (request as any).id },
    //         },
    //         response
    //     );
    // });
    beforeAll(async () => {
        await startServer(server, 0);
    });
    afterAll(async () => {
        await stopServer(server);
    });
    test('Todo CRUD', async () => {
        {
            const response = await request(server).get('todos', { responseType: 'json' });
            expect(response.statusCode).toEqual(200);
            expect(response.body).toMatchObject([]);
        }
        {
            const createData: Partial<TodoApp.Todo> = {
                title: 'Do the homework',
            };
            const createResponse = await request(server).post<TodoApp.Todo>('todos', {
                json: createData,
                responseType: 'json',
            });
            const detailResponse = await request(server).get(`todos/${createResponse.body.id}`, {
                responseType: 'json',
            });
            expect(detailResponse.body).toMatchObject(createData);
            expect(detailResponse.statusCode).toEqual(200);
            const response = await request(server).get('todos', { responseType: 'json' });
            expect(response.body).toMatchObject([createData]);
            expect(response.statusCode).toEqual(200);
        }
        {
            const listResponse = await request(server).get<TodoApp.Todo[]>('todos', { responseType: 'json' });
            expect(listResponse.body.length).toBeGreaterThan(0);
            await Promise.all(
                listResponse.body.map((todo) =>
                    request(server).put(`todos/${todo.id}`, {
                        json: { title: `updated(${todo.title})` },
                    })
                )
            );
            const listResponseAfter = await request(server).get<TodoApp.Todo[]>('todos', { responseType: 'json' });
            expect(listResponse.body.length).toBeGreaterThan(0);
            listResponseAfter.body.forEach((todo) => {
                expect(todo.title.startsWith('updated')).toEqual(true);
            });
        }
        {
            const response = await request(server).get<TodoApp.Todo[]>('todos', { responseType: 'json' });
            await Promise.all(
                response.body.map(async (todo) => {
                    const response = await request(server).delete(`todos/${todo.id}`);
                    expect(response.statusCode).toEqual(200);
                })
            );
            const responseAfter = await request(server).get('todos', { responseType: 'json' });
            expect(responseAfter.statusCode).toEqual(200);
            expect(responseAfter.body).toMatchObject([]);
        }
    });
    test('Authenticated request', async () => {
        const user = { username: 'john.doe@gmail.com', password: 'pa55w0rd' };
        const response = await request(server).get('me', {
            headers: { authorization: `Basic ${Buffer.from(`${user.username}:${user.password}`).toString('base64')}` },
            responseType: 'json',
        });
        expect(response.statusCode).toEqual(200);
        expect(response.body).toMatchObject({ username: user.username });
    });
    test('Authenticated request fails (Error serialization)', async () => {
        const response = await request(server).get('me', {
            headers: { authorization: 'Basic invalidtoken' },
            responseType: 'json',
        });
        expect(response.statusCode).toEqual(500);
        expect(response.headers['x-request-id']).toBeDefined();
    });
});
