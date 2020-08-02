import * as crypto from 'crypto';
import { http, message } from '../lib';

export interface Todo {
    id: number;
    title: string;
}
export type User = { username: string };
export type AuthenticatedRequest<TData = any, TAttributes = any> = message.Request<TData, TAttributes> & { user: User };

const generateRequestID: http.AsyncRouteHandler = (req, _res, cb) => {
    let requestID = req.headers['X-Request-ID'];
    if (!requestID) {
        requestID = crypto.randomBytes(10).toString('hex');
    }
    (req as any).id = requestID;
    cb();
};
let todos: Todo[] = [];
let idCounter = 1;
const createTodo = async (request: message.Request<Todo>) => {
    todos.push({
        ...request.data,
        id: idCounter,
    });
    idCounter += 1;
    return todos.slice(-1)[0];
};
const deleteTodo = async (request: message.Request) => {
    todos = todos.filter((todo) => todo.id !== Number(request.attributes.todoID));
};
const listTodo = async () => {
    return todos;
};
const getTodo = async (request: message.Request) => {
    return todos.find((todo) => todo.id === Number(request.attributes.todoID));
};

// Define request shape explicitly
type UpdateTodoRequest = message.Request<Partial<Todo>> & { attributes: { todoID: string } };
const updateTodo = async (request: UpdateTodoRequest) => {
    const id = Number(request.attributes.todoID);
    let todo = todos.find((todo) => todo.id === id)!;
    if (!todo) {
        throw new Error('Not Found');
    }
    todo = { ...todo, ...request.data, id: todo.id };
    todos = todos.map((td) => {
        if (td.id === todo.id) {
            return todo;
        }
        return td;
    });
    return todo;
};
const getSessionUser = async (request: AuthenticatedRequest) => {
    if (!request.user) {
        throw new Error('Unauthenticated');
    }
    return request.user;
};
const authentication: http.AsyncRouteHandler = async (req, _res, cb) => {
    const auth = req.headers.authorization;
    let user = undefined;
    if (auth) {
        // Let's use Basic authentication
        const encodedToken = auth.split(' ', 2)[1];
        if (encodedToken) {
            const token = Buffer.from(encodedToken, 'base64').toString();
            const parts = token.split(':', 2);
            if (parts.length === 2) {
                const [username] = parts;
                // Look for user in database;
                await new Promise((resolve) => setTimeout(resolve, 25));
                user = { username };
            }
        }
    }
    (req as any).user = user;
    cb();
};

const mw = {
    generateRequestID,
    authentication,
};
export { mw, createTodo, deleteTodo, listTodo, getTodo, updateTodo, getSessionUser };
