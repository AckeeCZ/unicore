import { fromRequest, RouteHandler } from './http';

export default (): RouteHandler => (req, res) => {
    const appInfo = {
        name: process.env.npm_package_name,
        version: process.env.npm_package_version,
    };

    res.json({
        '🦄': 'Greetings!',
        'Application I am running': appInfo,
        'My time is': new Date(),
        'I am online since': fromRequest(req, 'server').startAt,
    });
};
