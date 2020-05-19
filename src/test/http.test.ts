import { http } from '../lib';

describe('x', () => {
    test('Autostart starts on nextTick', async () => {
        const server = http.createServer({
            autoStartPort: 3000,
        });
        const handler = jest.fn(() => {});
        server.events.on('start', handler);
        await new Promise(process.nextTick);
        expect(handler.mock.calls.length).toEqual(1);
        await http.destroyServer(server);
    });
    test('Manual server start', async () => {
        const server = http.createServer();
        const handler = jest.fn(() => {});
        server.events.on('start', handler);
        await http.startServer(server, 3000);
        expect(handler.mock.calls.length).toEqual(1);
        await http.destroyServer(server);
    });
    test('Can destroy server without starting it', async () => {
        const server = http.createServer();
        await http.destroyServer(server);
    });
});
