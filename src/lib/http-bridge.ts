import { HandleFunction, NextHandleFunction, SimpleHandleFunction } from 'connect';
import { http } from 'lib';
import { nextTick } from 'process';

const expressjs = (handler: HandleFunction): http.RouteHandler => {
    let wrapper: NextHandleFunction;
    if (handler.length <= 2) {
        wrapper = (req, res, next) => {
            res.once('close', () => next());
            (handler as SimpleHandleFunction)(req, res);
        };
    } else if (handler.length === 3) {
        wrapper = (req, res, next) => {
            (handler as NextHandleFunction)(req, res, next);
        };
    } else {
        throw new Error('Error handlers are not supported. See unicore error handling.');
    }
    return async (req, res) => {
        await new Promise((resolve, reject) => {
            wrapper(req, res, (error?) => {
                if (error) {
                    return reject(error);
                }
                resolve();
            });
        });
    };
};

export { expressjs };
