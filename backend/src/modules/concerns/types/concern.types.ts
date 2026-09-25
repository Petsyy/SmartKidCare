import type { HydratedDocument } from "mongoose";
import type {
  ConcernCategory,
  ConcernStatus,
  IParentConcern,
} from "../../../models/ParentConcern";
import type { AuthenticatedUser } from "../../../shared/types/auth.types";

export type CreateConcernInput = {
  childId: string;
  category: ConcernCategory;
  subject: string;
  message: string;
};

export type ListConcernsInput = {
  status?: ConcernStatus;
  category?: ConcernCategory;
  page: number;
  limit: number;
};

export type AddConcernMessageInput = { message: string };
export type UpdateConcernStatusInput = {
  status: ConcernStatus;
  note?: string;
};

export type ConcernScope = { parent?: string; daycareCenter?: string };
export type ConcernDocument = HydratedDocument<IParentConcern>;

export type ConcernRepository = {
  findOwnedChild(childId: string, parentId: string): Promise<{
    _id: unknown;
    daycareCenter?: unknown;
  } | null>;
  create(data: Partial<IParentConcern>): Promise<ConcernDocument>;
  findDocumentById(id: string, scope: ConcernScope): Promise<ConcernDocument | null>;
  findDetailById(id: string, scope: ConcernScope): Promise<unknown | null>;
  list(
    scope: ConcernScope,
    filters: Pick<ListConcernsInput, "status" | "category">,
    page: number,
    limit: number,
  ): Promise<{ rows: unknown[]; total: number }>;
  save(concern: ConcernDocument): Promise<ConcernDocument>;
};

export type ConcernNotification = {
  parentId: string;
  concernId: string;
  type: "concern_reply" | "concern_status_changed";
  title: string;
  body: string;
};

export type ConcernServiceDependencies = {
  repository: ConcernRepository;
  getConfiguredCenterId(): Promise<string>;
  notifyParent(notification: ConcernNotification): Promise<void>;
  now(): Date;
};

export type ConcernServiceUser = AuthenticatedUser;
