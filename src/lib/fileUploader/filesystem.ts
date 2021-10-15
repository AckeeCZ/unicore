import { RequestHandler } from 'express'
import * as fs from 'fs'
import * as path from 'path'
import generateFileStamp from '../util/generateFileStamp'

declare module 'express-serve-static-core' {
    interface Request {
        files: any;
    }
}

const saveFiles = (dirname: string, files: Express.Multer.File[]) => {
    return Promise.all(
        files
            .map(file => ({
                id: generateFileStamp(),
                buffer: file.buffer,
            }))
            .map(async file => {
                await new Promise((resolve, reject) =>
                    fs.writeFile(path.join(dirname, file.id), file.buffer, (err, ...results) =>
                        err ? reject(err) : resolve(results)
                    )
                )
                return file.id
            })
    )
}

export default (dirname = '.'): RequestHandler => {
    return (req, _res, next) => {
        if (!req.files || !req.files.length) {
            return next()
        }
        // TODO: Fix `req.files` types and support for one file only
        return saveFiles(dirname, req.files as any[])
            .then(files => {
                req.files = files
                return next()
            })
            .catch(next)
    }
}
