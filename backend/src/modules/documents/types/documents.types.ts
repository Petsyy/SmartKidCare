export type ChildServiceResponse = {
  status: number;
  body: unknown;
};

export type AuthUser = {
  id: string;
  role: string;
};

export type ResolvedDocumentAccess = {
  signedUrl: string;
  documentType: string;
  contentType: string;
  fileName: string;
};
