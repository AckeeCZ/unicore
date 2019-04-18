import { RequestHandler } from 'express';

const defaultFinalHandler: RequestHandler = (req, res, _next) => {
    res.status(404);
    res.json({
        404: 'Not Found',
        request: req.originalUrl,
    });
};

export default defaultFinalHandler;
