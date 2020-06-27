import { http } from '../lib';

describe('HTTP - Start/Stop', () => {
    test('Create server instance', async () => {
        http.createServer();
    });
    test('Manual server start', async () => {
        const server = http.createServer();

        const eventHandler = jest.fn(() => {});
        server.events.on('start', eventHandler);

        await http.startServer(server, 0);
        expect(eventHandler.mock.calls.length).toEqual(1);

        await http.stopServer(server);
    });
    test('Automatic server start (on nextTick)', async () => {
        const server = http.createServer({
            autoStartPort: 0,
        });
        const handler = jest.fn(() => {});
        server.events.on('start', handler);
        await new Promise(process.nextTick);
        expect(handler.mock.calls.length).toEqual(1);
        await http.stopServer(server);
    });
    test('Stop a not-running server does nothing', async () => {
        const server = http.createServer();
        await http.stopServer(server);
    });
});
