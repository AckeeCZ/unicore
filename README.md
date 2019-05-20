# Unicore

###### Based on this [template](https://github.com/AckeeCZ/package-template/tree/6febde96d20cfec270e74d1557ba7644ff834e8c)

[![Build Status](https://img.shields.io/travis/com/AckeeCZ/unicore/master.svg?style=flat-square)](https://travis-ci.com/AckeeCZ/unicore)
[![Coverage](https://img.shields.io/codeclimate/coverage/AckeeCZ/unicore.svg?style=flat-square)](https://codeclimate.com/github/AckeeCZ/unicore)
[![Maintainability](https://img.shields.io/codeclimate/maintainability/AckeeCZ/unicore.svg?style=flat-square)](https://codeclimate.com/github/AckeeCZ/unicore)
[![Vulnerabilities](https://img.shields.io/snyk/vulnerabilities/github/AckeeCZ/unicore.svg?style=flat-square)](https://snyk.io/test/github/AckeeCZ/unicore?targetFile=package.json)
[![Dependency Status](https://img.shields.io/david/AckeeCZ/unicore.svg?style=flat-square)](https://david-dm.org/AckeeCZ/unicore)
[![Dev Dependency Status](https://img.shields.io/david/dev/AckeeCZ/unicore.svg?style=flat-square)](https://david-dm.org/AckeeCZ/unicore?type=dev)

Standard batteries-included Ackee suit for an API Core.

Built on top of [express](https://github.com/expressjs/express/) and [this is all you have to change](./docs/express-migration-guide.md).

## Features

- Promised `listen`.
- Destroyable server with `.destroy()`.
- Error processing with serializable `HttpJsonError` and `errorHandler`
- Includes
    - [tools for handling file\s ](./docs/file-uploads.md)
    - [parsing json](./docs/body-parsers.md)
- [Sentry](https://sentry.io) error reporting [support](./docs/sentry.md)
- Default request handlers (root with info, final handler)

## Quickstart

```js
import {
    createServer,
    jsonParser,
    defaultFinalHandler,
    defaultRootHandler,
    errorHandler,
} from 'unicore';

const server = createServer(options); // Enhanced Express app

server.use(defaultRootHandler);
server.use(errorHandler);
server.use(defaultFinalHandler);

server.listen(3000)
    .then(() => console.log('Listening.'))
    .then(() => server.destroy())
    .then(() => console.log('Server shut down.'));
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



## License

This project is licensed under [MIT](./LICENSE).
