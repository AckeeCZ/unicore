import { startServer, stopServer } from '../lib/http';
import http from 'http';

describe('HTTP - Start/Stop', () => {
    test('Manual server start', async () => {
        const server = new http.Server();
        await startServer(server, 0);
        await stopServer(server);
    });
    test('Stop a not-running server does nothing', async () => {
        const server = new http.Server();
        await stopServer(server);
    });
});
