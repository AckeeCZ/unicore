# Package template

###### Based on this [template](https://github.com/AckeeCZ/package-template/tree/6febde96d20cfec270e74d1557ba7644ff834e8c)

Standard batteries-included Ackee suit for an API Core.

Built on express.

Out of the box
- Promised express app start
- built in image upload-handlers (WIP)
- ready-to-use and preconfigured body parsing (using body-parser package)
- default handlers with useful info - (outer app package.json name and version, uptime..)
- Http errors (WIP)

## Quickstart

```js
import {
    createServer,
    jsonParser,
    defaultFinalHandler,
    defaultRootHandler,
} from 'unicore';

const server = createServer(options); // express app beneath
// options.sentry = { dsn: string } - Sentry DSN to use a sentry

server.use(defaultRootHandler);
server.use(defaultFinalHandler);

server.listen(3000); // Promise
```

```
-> GET http://localhost:3000
<-
{
    🦄: "Greetings!",
    Application I am running: {
        name: "your-api",
        version: "1.0.0"
    },
    My time is: "2018-05-24T12:56:18.340Z",
    I am online since: "2018-05-24T12:56:13.537Z"
}
```

## File uploads


Step 1: Use body parser to parse the multipart using `fileParser` (Note: files are parsed and stored temporarily in the memory)

Step 2: Request now contains a `files` property - an array of [multer parsed files](https://www.npmjs.com/package/multer#file-information)

Step 3: Handle the files, presumably save the file contents using one of the following uploaders.

#### File uploaders
File uploaders are an express middleware, that looks for request's `files` property. If `files` is not an empty array, it _uploads_ all of the files and transforms this property into a list of generated string ids.

```
⇓ an HTTP "multipart/form-data; boundary=BOUNDARY" request.

BOUNDARY
Content-Disposition: form-data; name="file1"; filename="file1.png"
fb c4 5c 07 d2 86 8b 86 72 db ...
BOUNDARY
Content-Disposition: form-data; name="file2"; filename="file1.png"
c6 96 23 59 44 42 4f 93 c2 8e  ...
BOUNDARY

⇓ a fileParser middleware

request: { files: MulterFile[], ...}

⇓ any fileUploader middleware

request: { files: ['2018068-4wqrvjr', ... ], ...}

⇓ `req.files` is now an array of the file identifiers to the uploader's storage
```

### Filesystem uploader

This Uploader "uploads" (=saves) the file to the local filesystem under a given folder.

Filesystem file name is a pseudo-random pattern of `YYYYMMDD-*******`.

#### Initial options (string)

A directory name where to upload the files. **Default**: _current directory_


#### Example
```js
const uploadFileSystem = require('unicore/fileUploaders/filesystem');
const fileParser = require('unicore/bodyParsing/fileParser');

const server = createServer();
server.use('/files', fileParser());
server.use(uploadFileSystem(/* dirname where to upload the files (string)*/));
server.use((req, res, next) => {
    res.json(req.files); // ['2018068-4wqrvjr', ... ]
});
```

### GCP Storage Bucket

This Uploader saves the file to the specified Google Cloud Storage.

The file id is a pseudo-random pattern of `{prefix}/YYYYMMDD-*******`.

Use `https://storage.googleapis.com/{bucket}/{fileId}` to retrieve the file.

#### Initial options (object)
Key | Type | Description
----|------|------------
`prefix` | string | A path-like prefix to prefix all the uploaded filenames with. **Default:** _none_
`bucket` | string | The destination bucket name. **Required**
`credentials` | object | Google Cloud Storage lib. credentials object. **Required**
`projectId` | string | Your Google Cloud Platform project ID. **Required**
`public` | boolean | Whether to upload files with public access allowed. **Default:** `true`



## License

This project is licensed under [MIT](./LICENSE).
