export type ChildRef = {
  _id: string;
  firstName: string;
  middleName?: string;
  middle?: string;
  middle_name?: string;
  lastName: string;
  studentId?: string;
};

export type FeedingApiResponse = {
  _id: string;
  date: string;
  foodServed: string;
  createdAt?: string;
  updatedAt?: string;
  teacher?: {
    _id: string;
    firstName: string;
    lastName: string;
  } | null;
  records: Array<{
    child: ChildRef | string;
    status: "completed" | "missed";
    notes?: string;
    blockchainVerified?: boolean;
  }>;
};

export type FeedingRow = {
  id: string;
  date: string;
  studentId: string;
  childName: string;
  foodServed: string;
  status: "completed" | "missed";
  notes: string;
  teacherName: string;
  submittedAt: string;
  blockchainVerified: boolean;
};

export type PaginatedFeedingResponse = {
  data: FeedingRow[];
  foodOptions?: string[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
};

export type DatePreset = "all" | "today" | "thisWeek" | "thisMonth";
export type FeedingStatusFilter = "all" | "completed" | "missed";

export type UseFeedingProgramOptions = {
  initialDatePreset?: DatePreset;
};

export type FeedingQueryResult = {
  rows: FeedingRow[];
  foodOptions: string[];
  total: number;
  totalPages: number;
};

export type UpdateFeedingRecordPayload = {
  status?: "completed" | "missed";
  notes?: string;
};

