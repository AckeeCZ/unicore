# Express.js migration guide

Unicore is built on top of an Express app. Do this to use unicore's express:

### Server. Before.
```js
const express = require('express');
const app = express();
```
### Server. After.
```js
const { createServer } = require('unicore');
const app = createServer();
```


### Routes. Before.
You can still use your express' routes, of course! But if you don't want to have express as a dependency on you own, you can use provided method `createRouter`.
```js
const express = require('express');
const router = express.Router();
```

### Routes. After.
```js
const { createRouter } = require('unicore');
const router = createRouter();
```