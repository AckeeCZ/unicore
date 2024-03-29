import { Bucket } from '@google-cloud/storage'
import { Request, RequestHandler } from 'express'
import * as path from 'path'
import { Readable } from 'stream'
import generateFileStamp from '../util/generateFileStamp'

interface Options {
    prefix?: string;
    bucket: string;
    // eslint-disable-next-line @typescript-eslint/ban-types
    credentials: object | string;
    projectId: string;
    public?: boolean;
    generateFileName?: (params: { originalFile: File; id: string }, request?: Request) => string;
}

type File = Express.Multer.File | { buffer: Buffer | ArrayBuffer; mimetype: string }

const assignOptions = (givenOptions: Options) => {
    if (!givenOptions) {
        throw new Error('GcpBucket uploader missing options. None given.')
    }
    if (typeof givenOptions !== 'object') {
        throw new TypeError('GcpBucket uploader options are invalid - not an object.')
    }
    (['bucket'] as Array<keyof Options>).forEach(propName => {
        if (!givenOptions[propName]) {
            throw new Error(`GcpBucket uploader missing an option: \`${propName}\``)
        }
    })

    if ('public' in givenOptions && typeof givenOptions.public !== 'boolean') {
        throw new TypeError('GcpBucket uploader option `public` is invalid - not a boolean.')
    }

    return Object.assign({ prefix: '/', public: true }, givenOptions)
}

const iniStorageClient = (options: Options) => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { Storage } = require('@google-cloud/storage')
    return new Storage(options)
}

export const saveFiles = (bucket: Bucket, files: File[], options: Options, request?: Request) => {
    return Promise.all(
        files
            .map(file => ({
                id: generateFileStamp(),
                originalFile: file,
            }))
            .map(async file => {
                const fileName = options.generateFileName ? options.generateFileName(file, request) : file.id
                const fileId = path.posix.join(options.prefix!, fileName)

                const fileStream = new Readable()
                fileStream.push(file.originalFile.buffer)
                fileStream.push(null)

                const uploadParams = {
                    public: options.public,
                    metadata: {
                        contentType: file.originalFile.mimetype,
                    },
                }
                // File should not have leading slash
                const remoteFile = bucket.file(fileId.replace(/^\//, '')).createWriteStream(uploadParams)
                await new Promise((resolve, reject) =>
                    fileStream
                        .pipe(remoteFile)
                        .on('error', reject)
                        .on('finish', resolve)
                )
                return { fileId, originalFile: file.originalFile }
            })
    )
}

export default (options: Options): RequestHandler => {
    options = assignOptions(options)
    const storageClient = iniStorageClient(options)
    const bucket = storageClient.bucket(options.bucket)

    return (req, _res, next) => {
        if (!req.files || !req.files.length) {
            return next()
        }
        return saveFiles(bucket, req.files, options, req)
            .then(files => {
                req.files = files
                return next()
            })
            .catch(next)
    }
}
