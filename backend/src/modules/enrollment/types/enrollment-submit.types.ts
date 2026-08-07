export type AuthUser = {
  id?: string;
  role?: string;
};

export type UploadedFiles = {
  [fieldname: string]: Express.Multer.File[];
} | undefined;

export type SubmitEnrollmentRequestCommand = {
  user?: AuthUser;
  body: Record<string, unknown>;
  files?: UploadedFiles;
};
