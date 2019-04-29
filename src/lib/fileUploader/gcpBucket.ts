import { Bucket } from '@google-cloud/storage';
import { RequestHandler } from 'express';
import generateFileStamp from 'lib/util/generateFileStamp';
import * as path from 'path';
import { Readable } from 'stream';

interface Options {
    prefix?: string;
    bucket: string;
    credentials: object | string;
    projectId: string;
    public?: boolean;
}

const assignOptions = (givenOptions: Options) => {
    if (!givenOptions) {
        throw new Error('GcpBucket uploader missing options. None given.');
    }
    if (typeof givenOptions !== 'object') {
        throw new TypeError('GcpBucket uploader options are invalid - not an object.');
    }
    (['bucket', 'credentials', 'projectId'] as Array<keyof Options>).forEach(propName => {
        if (!givenOptions[propName]) {
            throw new Error(`GcpBucket uploader missing an option: \`${propName}\``);
        }
    });

    if ('public' in givenOptions && typeof givenOptions.public !== 'boolean') {
        throw new TypeError('GcpBucket uploader option `public` is invalid - not a boolean.');
    }

    return Object.assign({ prefix: '/', public: true }, givenOptions);
};

const iniStorageClient = (options: Options) => {
    const storage = require('@google-cloud/storage')(options);
    return storage;
};

const saveFiles = (bucket: Bucket, files: Express.Multer.File[], options: Options) => {
    return Promise.all(
        files
            .map(file => ({
                id: generateFileStamp(),
                buffer: file.buffer,
                mimetype: file.mimetype,
            }))
            .map(file => {
                const fileId = path.posix.join(options.prefix!, file.id);

                const fileStream = new Readable();
                fileStream.push(file.buffer);
                fileStream.push(null);

                const uploadParams = {
                    public: options.public,
                    metadata: {
                        contentType: file.mimetype,
                    },
                };

                const remoteFile = bucket.file(fileId).createWriteStream(uploadParams);
                return new Promise((resolve, reject) =>
                    fileStream
                        .pipe(remoteFile)
                        .on('error', reject)
                        .on('finish', resolve)
                ).then(() => fileId);
            })
    );
};

export default (options: Options): RequestHandler => {
    options = assignOptions(options);
    const storageClient = iniStorageClient(options);
    const bucket = storageClient.bucket(options.bucket);

    return (req, _res, next) => {
        if (!req.files || !req.files.length) {
            return next();
        }
        // TODO Fix types
        return saveFiles(bucket, req.files as any[], options)
            .then(files => {
                req.files = files;
                return next();
            })
            .catch(next);
    };
};
