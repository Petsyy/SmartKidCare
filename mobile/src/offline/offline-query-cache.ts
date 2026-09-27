import {
  dehydrate,
  hydrate,
  type DehydratedState,
  type QueryClient,
} from "@tanstack/react-query";
import {
  readEncryptedQueryCache,
  saveEncryptedQueryCache,
} from "./offline-database";

const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
const ALLOWED_QUERY_PREFIXES = new Set([
  "teacherAttendanceSetup",
  "parentAttendanceChildren",
  "parentAttendanceHistory",
  "teacherFeedingSetup",
  "parentFeedingChildren",
  "parentFeedingHistory",
  "profile",
  "parentChildrenList",
  "parentChildrenStatusOverview",
  "parentChildrenDashboard",
  "parentDashboard",
  "teacherDashboard",
  "teacherChildrenOverview",
  "teacherChildDetails",
  "parentChildDetails",
  "competencyDefinitions",
]);

export const persistAllowedQueries = async (
  queryClient: QueryClient,
  userId: string,
) => {
  const state = dehydrate(queryClient, {
    shouldDehydrateQuery: (query) =>
      query.state.status === "success" &&
      ALLOWED_QUERY_PREFIXES.has(String(query.queryKey[0] ?? "")),
  });
  await saveEncryptedQueryCache(userId, JSON.stringify(state));
};

export const hydrateAllowedQueries = async (
  queryClient: QueryClient,
  userId: string,
) => {
  const stored = await readEncryptedQueryCache(userId);
  if (!stored) return;
  if (Date.now() - Date.parse(stored.updated_at) > MAX_AGE_MS) return;
  hydrate(queryClient, JSON.parse(stored.cache_json) as DehydratedState);
};
