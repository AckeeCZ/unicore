import * as fs from 'fs';
import * as rp from 'request-promise';
import * as request from 'supertest';
import {
    createServer,
    defaultFinalHandler,
    defaultRootHandler,
    errorHandler,
    fileParser,
    HttpJsonError,
    jsonParser,
    uploadFilesystem,
    uploadGcp,
} from '../lib';

describe('Server', () => {
    describe('General properties', () => {
        test('Promised start', async () => {
            const server = createServer();
            await new Promise((resolve, reject) =>
                server
                    .listen(3000)
                    .then(resolve)
                    .catch(reject)
            );
            server.destroy();
        });
        test('Destroyable server', async () => {
            const server = createServer();
            await server.listen(3000);
            server.destroy();
        });
    });
    describe('Body parsing', () => {
        it('JSON using `jsonParser`', async () => {
            const server = createServer();
            server.use(jsonParser(), (req, res) => {
                res.json(req.body);
            });
            const payload = { hello: 'world' };
            const { body } = await request(server)
                .post('/')
                .send(payload)
                .expect(200);
            expect(body).toMatchObject(payload);
        });
        it('File using `fileParser`', async () => {
            const server = createServer()
                .use('/files', fileParser())
                .use((req, res) => {
                    res.json({ files: (req.files as any[]).map(item => ({ ...item, buffer: '<Buffer>' })) });
                });
            const { body } = await request(server)
                .post('/files')
                .attach('image', 'src/test/test-image.png')
                .attach('image2', 'src/test/test-image.png')
                .set('Content-Type', 'multipart/form-data; boundary=---BOUNDARY')
                .expect(200);
            expect(body).toMatchInlineSnapshot(`
                Object {
                  "files": Array [
                    Object {
                      "buffer": "<Buffer>",
                      "encoding": "7bit",
                      "fieldname": "image",
                      "mimetype": "image/png",
                      "originalname": "test-image.png",
                      "size": 70,
                    },
                    Object {
                      "buffer": "<Buffer>",
                      "encoding": "7bit",
                      "fieldname": "image2",
                      "mimetype": "image/png",
                      "originalname": "test-image.png",
                      "size": 70,
                    },
                  ],
                }
            `);
        });
    });
    describe('Quick handlers', () => {
        it('Final handler (Status 404)', async () => {
            const server = createServer();
            server.use(defaultFinalHandler);
            await request(server)
                .get('/')
                .expect(404);
        });
        it('Root hanlder (Status 200 and server info)', async () => {
            const server = createServer();
            server.use(defaultRootHandler);
            const { body } = await request(server)
                .get('/')
                .expect(200);
            expect(body).toMatchInlineSnapshot(
                {
                    'My time is': expect.any(String),
                    'I am online since': expect.any(String),
                    'Application I am running': {
                        name: expect.any(String),
                        version: expect.any(String),
                    },
                },
                `
                Object {
                  "Application I am running": Object {
                    "name": Any<String>,
                    "version": Any<String>,
                  },
                  "I am online since": Any<String>,
                  "My time is": Any<String>,
                  "🦄": "Greetings!",
                }
            `
            );
        });
    });
    it('HttpJsonError', async () => {
        const server = createServer()
            .use((_req, _res, next) => {
                next(new HttpJsonError(422, 'An error', '123', { foo: 'bar' }));
            })
            .use(errorHandler);
        const { body } = await request(server)
            .get('/')
            .expect(422);
        expect(body).toMatchInlineSnapshot(
            { error: { stack: expect.any(String) } },
            `
            Object {
              "error": Object {
                "errorClass": "HttpJsonError",
                "errorCode": "123",
                "errorData": Object {
                  "foo": "bar",
                },
                "message": "An error",
                "stack": Any<String>,
                "status": 422,
              },
            }
        `
        );
    });
    describe('File upload', () => {
        it('To FileSystem', async () => {
            const server = createServer()
                .use('/files', fileParser())
                .use('/files', uploadFilesystem())
                .use((req, res) => {
                    res.json(req.files);
                });
            const fileName = 'src/test/test-image.png';
            const { body } = await request(server)
                .post('/files')
                .attach('image', fileName)
                .set('Content-Type', 'multipart/form-data; boundary=---BOUNDARY')
                .expect(200);
            expect(Array.isArray(body)).toBe(true);
            expect(body.length).toBe(1);
            expect(typeof body[0]).toBe('string');

            // Check file contents
            const originalFile = fs.readFileSync(fileName);
            const uploadedFile = fs.readFileSync(body[0]);
            expect(originalFile).toEqual(uploadedFile);
            // Delete the file from fs
            await new Promise((resolve, reject) =>
                fs.unlink(body[0], (err, ...results) => (err ? reject(err) : resolve(results)))
            );
        });
        // Skipped for shared secrets problem
        it.skip('GCP Bucket', async () => {
            const options = {
                bucket: process.env.GCP_STORAGE_BUCKET || 'ackee__unicore',
                // Use default credentials
            };
            const server = createServer()
                .use('/files', fileParser())
                .use('/files', uploadGcp(options as any))
                .use((req, res) => {
                    res.json(req.files);
                });

            const fileName = 'src/test/test-image.png';
            const { body } = await request(server)
                .post('/files')
                .attach('image', fileName)
                .set('Content-Type', 'multipart/form-data; boundary=---BOUNDARY')
                .expect(200);
            expect(Array.isArray(body)).toBe(true);
            expect(body.length).toBe(1);
            expect(typeof body[0]).toBe('object');
            expect(Object.keys(body[0]).sort()).toEqual(['fileId', 'originalFile'].sort());
            const { fileId } = body[0];
            // Check file contents
            const [uploadedFile, originalFile] = await Promise.all([
                rp(`https://storage.googleapis.com/${options.bucket}${fileId}`, { encoding: null }),
                fs.readFileSync(fileName),
            ]);
            expect(originalFile).toEqual(uploadedFile);
        });
    });
});
