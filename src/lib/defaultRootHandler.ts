import { RequestHandler } from 'express'

const appInfo = {
    name: process.env.npm_package_name,
    version: process.env.npm_package_version,
}

const defaultRootHandler: RequestHandler = (req, res, _next) => {
    res.json({
        '🦄': 'Greetings!',
        'Application I am running': appInfo,
        'My time is': new Date(),
        'I am online since': req.app.startAt,
    })
}

export default defaultRootHandler
