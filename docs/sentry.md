# Sentry

```js
import { createServer } from 'unicore';

const server = createServer({ sentry: { dsn: 'sentrydsn' } });
server.use(server.sentry.requestHandler());
// ...Your handlers and middlewares
// ...
// And as final middleware:
server.use(server.sentry.errorHandler());
```

Only connects to sentry if `sentry` option is available. `server.sentry` is always available and interface is the same.