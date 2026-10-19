import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getMyClassCompetencyStatus } from "@/src/api/competency.api";
import { getChildren } from "@/src/api/teacher.api";
import { useAuth } from "@/src/hooks/use-auth";
import { useOffline } from "@/src/offline/offline-context";
import {
  onlineWithOfflineFallback,
  readOfflineResource,
} from "@/src/offline/offline-read";
import { mobileQueryKeys } from "@/src/lib/query-keys";
import { listDraftsByType } from "@/src/offline/offline-store";
import type { CompetencyDraftPayload } from "@/src/offline/offline.types";
import { getManilaDateKey, toManilaDateKey } from "@/src/utils/manila-date";
import type { Child } from "@/src/api/api.types";

export type QueuePeriod = "quarterly" | "final";
export type QueueFilter =
  "all" | "remaining" | "draft" | "completed" | "locked";

export function useCompetencyQueue() {
  const { user } = useAuth();
  const { isConnected, isInternetReachable } = useOffline();
  const isOffline = !isConnected || !isInternetReachable;
  const [period, setPeriod] = useState<QueuePeriod>("quarterly");
  const [date, setDate] = useState(getManilaDateKey());
  const [filter, setFilter] = useState<QueueFilter>("all");
  const [search, setSearch] = useState("");
  const query = useQuery({
    queryKey: mobileQueryKeys.competencyClassStatus(period, date),
    networkMode: "always",
    enabled: Boolean(user?.id),
    queryFn: async () => {
      const [queueData, drafts] = await Promise.all([
        onlineWithOfflineFallback(
          isOffline,
          async () => ({
            children: await getChildren(),
            response: await getMyClassCompetencyStatus(period, date),
          }),
          async () => {
            if (!user?.id) return { children: [], response: { statuses: [] } };
            const [children, evaluations] = await Promise.all([
              readOfflineResource<Child>(user.id, "children"),
              readOfflineResource<{
                _id: string;
                child: string;
                period: QueuePeriod;
                status: string;
                evaluationDate: string;
              }>(user.id, "competencyEvaluations"),
            ]);
            const quarterlyChildren = new Set(
              evaluations
                .filter(
                  (item) =>
                    item.period === "quarterly" && item.status === "submitted",
                )
                .map((item) => String(item.child)),
            );
            return {
              children,
              response: {
                statuses: children.map((child) => {
                  const submitted = evaluations.find(
                    (item) =>
                      String(item.child) === child._id &&
                      item.period === period &&
                      item.status === "submitted" &&
                      toManilaDateKey(item.evaluationDate) === date,
                  );
                  return {
                    childId: child._id,
                    status: submitted
                      ? ("submitted" as const)
                      : period === "final" && !quarterlyChildren.has(child._id)
                        ? ("locked" as const)
                        : ("not_started" as const),
                  };
                }),
              },
            };
          },
        ),
        user?.id
          ? listDraftsByType(user.id, "competency")
          : Promise.resolve([]),
      ]);
      const { children, response } = queueData;
      const statusMap = new Map(
        response.statuses.map((item) => [item.childId, item]),
      );
      const draftChildren = new Set(
        drafts
          .map((draft) => draft.payload as CompetencyDraftPayload)
          .filter(
            (draft) => draft.period === period && draft.evaluationDate === date,
          )
          .map((draft) => draft.childId),
      );
      return children
        .map((child) => {
          const serverStatus =
            statusMap.get(child._id)?.status || "not_started";
          return {
            child,
            status:
              serverStatus === "not_started" && draftChildren.has(child._id)
                ? ("draft" as const)
                : serverStatus,
          };
        })
        .sort((a, b) =>
          `${a.child.lastName} ${a.child.firstName}`.localeCompare(
            `${b.child.lastName} ${b.child.firstName}`,
          ),
        );
    },
  });
  const items = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (query.data || []).filter((item) => {
      const matchesSearch = `${item.child.firstName} ${item.child.lastName}`
        .toLowerCase()
        .includes(term);
      const matchesFilter =
        filter === "all" ||
        (filter === "remaining"
          ? item.status === "not_started" || item.status === "draft"
          : item.status === filter ||
            (filter === "completed" && item.status === "submitted"));
      return matchesSearch && matchesFilter;
    });
  }, [filter, query.data, search]);
  const counts = useMemo(
    () => ({
      total: query.data?.length || 0,
      completed:
        query.data?.filter((item) => item.status === "submitted").length || 0,
      draft: query.data?.filter((item) => item.status === "draft").length || 0,
      locked:
        query.data?.filter((item) => item.status === "locked").length || 0,
    }),
    [query.data],
  );
  const queueIds = (query.data || [])
    .filter((item) => item.status === "not_started" || item.status === "draft")
    .map((item) => item.child._id);
  return {
    ...query,
    items,
    counts,
    queueIds,
    period,
    setPeriod,
    date,
    setDate,
    filter,
    setFilter,
    search,
    setSearch,
    isOffline,
  };
}
