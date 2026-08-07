import type { RecordServiceSupport } from "../../../shared/services/record-service-support";
import type { notifyFeedingSubmitted } from "../../notifications/services/record-event-notification.service";
import type { childRepository, feedingRepository, findChildIdsByParent, findFeedingById, findFeedingHistory } from "../repositories/feeding.repository";
export type FeedingAuthUser = { id: string; role: string };

export type AuthUser = FeedingAuthUser;

export type SubmitFeedingInput = {
  date: unknown;
  foodServed: unknown;
  records: unknown;
};

export type FeedingResult = {
  isUpdate: boolean;
  feeding: any;
};

export type PaginatedResult<T> = {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
};

export interface FeedingServiceDependencies {
  support: RecordServiceSupport;
  childRepository: typeof childRepository;
  feedingRepository: typeof feedingRepository;
  findChildIdsByParent: typeof findChildIdsByParent;
  findHistory: typeof findFeedingHistory;
  findById: typeof findFeedingById;
  notifySubmitted: typeof notifyFeedingSubmitted;
}
