import * as multer from 'multer';

declare module 'express-serve-static-core' {
    interface Application {
        files: [];
    }
}

export default function fileParser(options: multer.Options = {}) {
    const storage = multer.memoryStorage();
    const fileUpload = multer({ ...options, storage });
    return fileUpload.any();
}
