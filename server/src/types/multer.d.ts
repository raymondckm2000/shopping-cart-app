declare module 'multer' {
  type Request = import('express').Request;
  type RequestHandler = import('express').RequestHandler;

  interface MulterFile {
    fieldname: string;
    originalname: string;
    encoding: string;
    mimetype: string;
    size: number;
    destination: string;
    filename: string;
    path: string;
    buffer: Buffer;
  }

  interface StorageEngine {}

  interface DiskStorageOptions {
    destination?: (
      req: Request,
      file: MulterFile,
      callback: (error: Error | null, destination: string) => void,
    ) => void;
    filename?: (
      req: Request,
      file: MulterFile,
      callback: (error: Error | null, filename: string) => void,
    ) => void;
  }

  interface MulterOptions {
    storage?: StorageEngine;
  }

  interface MulterInstance {
    single(fieldname: string): RequestHandler;
  }

  interface MulterModule {
    (options?: MulterOptions): MulterInstance;
    diskStorage(options?: DiskStorageOptions): StorageEngine;
  }

  const multer: MulterModule;

  export type { MulterFile, StorageEngine, DiskStorageOptions, MulterOptions };
  export default multer;
}

declare module 'express-serve-static-core' {
  interface Request {
    file?: import('multer').MulterFile;
  }
}
