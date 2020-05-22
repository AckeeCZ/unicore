
const fs = require('fs');
const http = require('http');
const path = require('path');

const OUT_FILE = path.join(__dirname, '..', 'src', 'lib', 'http-method.ts');

const writeLn = (str) => {
    fs.appendFileSync(OUT_FILE, `${str}\n`);
};

fs.writeFileSync(OUT_FILE, '');
writeLn('import { customMethod, RouteHandler } from \'./http\';');
writeLn('');

http.METHODS.forEach(method => {
    const exportName = method.toLocaleLowerCase()
        .replace(/[^a-zA-Z]*/g, '');
    // Module export cannot be named delete
    if (method === 'DELETE') {
        writeLn(`const del = (handler: RouteHandler) => customMethod('${method}', handler);`);
        writeLn('export { del as delete };');
        return;
    }
    writeLn(`export const ${exportName} = (handler: RouteHandler) => customMethod('${method}', handler);`);
});
