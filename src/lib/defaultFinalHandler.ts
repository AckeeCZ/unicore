import { RequestHandler } from 'express';

const notFoundHandler: RequestHandler = (req, res, _next) => {
    res.status(404);
    res.json({
        404: 'Not Found',
        request: req.originalUrl,
    });
};

export default notFoundHandler;
