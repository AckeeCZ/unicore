import * as multer from 'multer';

declare module 'express-serve-static-core' {
    interface Application {
        files: [];
    }
}

export default function fileParser() {
    const storage = multer.memoryStorage();
    const fileUpload = multer({ storage });
    return fileUpload.any();
}
