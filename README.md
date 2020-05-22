<div align="center">


# Unicore
[![Build Status](https://img.shields.io/travis/com/AckeeCZ/unicore/master.svg?style=flat-square)](https://travis-ci.com/AckeeCZ/unicore)
[![Coverage](https://img.shields.io/codecov/c/github/AckeeCZ/unicore?style=flat-square)](https://codecov.io/gh/AckeeCZ/unicore)
[![Maintainability](https://img.shields.io/codeclimate/maintainability/AckeeCZ/unicore.svg?style=flat-square)](https://codeclimate.com/github/AckeeCZ/unicore)
[![Vulnerabilities](https://img.shields.io/snyk/vulnerabilities/github/AckeeCZ/unicore.svg?style=flat-square)](https://snyk.io/test/github/AckeeCZ/unicore?targetFile=package.json)
[![Dependency Status](https://img.shields.io/david/AckeeCZ/unicore.svg?style=flat-square)](https://david-dm.org/AckeeCZ/unicore)
[![Dev Dependency Status](https://img.shields.io/david/dev/AckeeCZ/unicore.svg?style=flat-square)](https://david-dm.org/AckeeCZ/unicore?type=dev)
</div>

```ts
const server = http.createServer({
    routes: {
        '/': http.get(requestHandler),
    }
})
```

## TL;DR User manual

### Server

- create server instance
    ```ts
    import { createServer } from 'unicore/http'
    const server = createServer(serverOptions)
    ```
- manual server start
    ```ts
    import { startServer } from 'unicore/http',
    startServer(server, port)
    ```
- automatic server start
    - via `autoStartPort` server option
    - server starts automatically on this port on next process tick
    ```ts
    createServer({ autoStartPort: 3000 })
    ```
- stop server 
    ```ts
    import { destroyServer } from 'unicore/http'
    await destroyServer(server)
    ```
- subscribe to server events
    - via `server.events` event emitter
    - see Server event for more detailed info
    ```ts
    server.events.on(event, handler)
    ```
### Server events
- accessible via `server.events` emitter
- `error`
    ```ts
    (error: Error) => void
    ```
### Routing

- setup
    - via `routes` server option
    - routes key can be any string and matching is based on [express routing](https://expressjs.com/en/guide/routing.html)
    - routes value can be [express middleware](https://expressjs.com/en/guide/using-middleware.html) or a "handler function" (to use express terminology)
    - generally, handler is call on a route for all the methods, see below how to handle only some or more http methods
    ```ts
    createServer({
        routes: {
            '/': (req, res, next) => void
        }
    })
    ```
- hello route
    - a simple handler you can use to print some server info 
    ```ts
    import { hello } from 'unicore/http'
    routes: { '/': hello }
    ```
- specific method handlers
    - to invoke handler for a specific method only, use `method` export
    - every method wrapes a handler into a middleware, that invokes the handler only if the request if for the given method
    - method contains all methods Node.js supports
    ```ts
    import { method } from 'unicore/http'
    routes: { '/get': method.get(handler) }
    // GET /get invokes the handler
    ```
- first-class method support get, put, post, patch, delete
    - you can import these directly from `unicore/http`
    ```ts
    import { get } from 'unicore/http'
    routes: { '/': get(handler) }
    ```
- multiple method handlers on a single route
    - via `compose` fn, that is just [compose-middleware](https://github.com/blakeembrey/compose-middleware), method wrappers will do the rest
    - ℹ️ you can use handler's _next_ function to pass it on to the next handler that should match the request
    - ⚠️ if you stack multiple handlers on the same route with the same method wrapper, first handler is matched and called first, and if you don't pass via _next_ function, second handler won't be called at all
    ```ts
    import { compose get, post } from 'unicore/http'
    routes: { '/': compose(get(getHandler), post(postHandler)) }
    ```
## License

This project is licensed under [MIT](./LICENSE).
