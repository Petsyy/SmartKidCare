import type { HydratedDocument } from "mongoose";
import type { UploadResult } from "../../../shared/utils/upload-cloudinary";
export type ChildDocumentUploads = {
  birthUpload?: UploadResult | null;
  parentUpload?: UploadResult | null;
  birthDocumentHash?: string | null;
  parentIdDocumentHash?: string | null;
};

export type CreateChildRecordPayload = {
  _id?: import("mongoose").Types.ObjectId;
  firstName: string;
  middleName?: string;
  lastName: string;
  dateOfBirth: Date | string;
  age: number;
  gender: string;
  homeAddress: string;
  parentRelationship: string;
  programType: string;
  enrollmentDate: Date | string;
  schoolYear: string;
  weight?: number | null;
  height?: number | null;
  bmi?: number | null;
  nutritionalStatus?: string | null;
  status: string;
  studentId: string;
  parent?: import("mongoose").Types.ObjectId | string | null;
  teacher?: import("mongoose").Types.ObjectId | string | null;
  daycareCenter?: import("mongoose").Types.ObjectId | string | null;
};

export type ChildAnchorResult = null;

export type ChildRecordCreationResult = {
  child: HydratedDocument<any>;
  documentsAnchor: ChildAnchorResult;
};
