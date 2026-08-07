export type UploadedFiles = {
  [fieldname: string]: Express.Multer.File[];
} | undefined;
