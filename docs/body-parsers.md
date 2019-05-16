# Body parsers

Based on [body-parser](https://github.com/expressjs/body-parser).


## JSON
```ts
import { createServer, jsonParser } from 'unicore';

createServer()
    .use(jsonParser())
    .use((req, res) => {
        // JSON request payloads are automatically parsed and req.body is set
        res.json(req.body);
    });
```