import { Bucket } from '@google-cloud/storage';
import { RequestHandler } from 'express';
import * as path from 'path';
import { Readable } from 'stream';
import generateFileStamp from '../util/generateFileStamp';

interface Options {
    prefix?: string;
    bucket: string;
    credentials: object | string;
    projectId: string;
    public?: boolean;
    generateFileName?: (params: { originalFile: File; id: string }) => string;
}

type File = Express.Multer.File | { buffer: Buffer | ArrayBuffer; mimetype: string };

const assignOptions = (givenOptions: Options) => {
    if (!givenOptions) {
        throw new Error('GcpBucket uploader missing options. None given.');
    }
    if (typeof givenOptions !== 'object') {
        throw new TypeError('GcpBucket uploader options are invalid - not an object.');
    }
    (['bucket'] as Array<keyof Options>).forEach(propName => {
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
    const { Storage } = require('@google-cloud/storage');
    const storage = new Storage(options);
    return storage;
};

export const saveFiles = (bucket: Bucket, files: File[], options: Options) => {
    return Promise.all(
        files
            .map(file => ({
                id: generateFileStamp(),
                originalFile: file,
            }))
            .map(file => {
                const fileName = options.generateFileName ? options.generateFileName(file) : file.id;
                const fileId = path.posix.join(options.prefix!, fileName);

                const fileStream = new Readable();
                fileStream.push(file.originalFile.buffer);
                fileStream.push(null);

                const uploadParams = {
                    public: options.public,
                    metadata: {
                        contentType: file.originalFile.mimetype,
                    },
                };

                const remoteFile = bucket.file(fileId).createWriteStream(uploadParams);
                return new Promise((resolve, reject) =>
                    fileStream
                        .pipe(remoteFile)
                        .on('error', reject)
                        .on('finish', resolve)
                ).then(() => ({ fileId, originalFile: file.originalFile }));
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
        return saveFiles(bucket, req.files, options)
            .then(files => {
                req.files = files;
                return next();
            })
            .catch(next);
    };
};
