import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  AlertCircle,
  Inbox,
  MessageSquare,
  RefreshCw,
  Send,
} from "lucide-react";
import Layout from "@/components/layout/Layout";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { ErrorAlert } from "@/components/ui/ErrorAlert";
import { Pagination } from "@/components/ui/Pagination";
import { SelectFilter } from "@/components/ui/SelectFilter";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  useCaptainConcernDetail,
  useCaptainConcernList,
} from "@/features/concerns/hooks/useCaptainConcerns";
import {
  CONCERN_CATEGORIES,
  CONCERN_STATUSES,
  concernCategoryLabel,
  concernStatusLabel,
  type ConcernCategory,
  type ConcernPerson,
  type ConcernStatus,
} from "@/features/concerns/types";

const NEXT_STATUS: Partial<Record<ConcernStatus, ConcernStatus>> = {
  new: "acknowledged",
  acknowledged: "in_progress",
  in_progress: "resolved",
  resolved: "closed",
};

const STATUS_CLASSES: Record<ConcernStatus, string> = {
  new: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300",
  acknowledged: "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300",
  in_progress:
    "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  resolved:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  closed: "bg-gray-200 text-gray-700 dark:bg-slate-700 dark:text-slate-300",
};

const formatName = (
  person: ConcernPerson | string | null | undefined,
  fallback: string,
) => {
  if (!person || typeof person === "string") return fallback;
  return [person.firstName, person.middleName, person.lastName]
    .filter(Boolean)
    .join(" ");
};

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("en-PH", {
    month: "short",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Manila",
  }).format(new Date(value));

export default function CaptainConcerns() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedId = searchParams.get("id");
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<ConcernStatus | "all">("all");
  const [category, setCategory] = useState<ConcernCategory | "all">("all");
  const [reply, setReply] = useState("");
  const [statusNote, setStatusNote] = useState("");

  const listQuery = useCaptainConcernList({
    page,
    limit: 10,
    status: status === "all" ? undefined : status,
    category: category === "all" ? undefined : category,
  });
  const detail = useCaptainConcernDetail(selectedId);
  const concern = detail.query.data?.data;
  const nextStatus = concern ? NEXT_STATUS[concern.status] : undefined;

  const rangeLabel = useMemo(() => {
    const pagination = listQuery.data?.pagination;
    if (!pagination || pagination.total === 0) return "No concerns found";
    const start = (pagination.page - 1) * pagination.limit + 1;
    const end = Math.min(pagination.page * pagination.limit, pagination.total);
    return `${start}-${end} of ${pagination.total} concerns`;
  }, [listQuery.data?.pagination]);

  const selectConcern = (id: string) => {
    const next = new URLSearchParams(searchParams);
    next.set("id", id);
    setSearchParams(next);
    setReply("");
    setStatusNote("");
  };

  const submitReply = async () => {
    if (!reply.trim()) return;
    try {
      await detail.replyMutation.mutateAsync(reply.trim());
      setReply("");
    } catch {
      // Mutation error is displayed inline.
    }
  };

  const advanceStatus = async () => {
    if (!nextStatus) return;
    try {
      await detail.statusMutation.mutateAsync({
        status: nextStatus,
        note: statusNote,
      });
      setStatusNote("");
    } catch {
      // Mutation error is displayed inline.
    }
  };

  return (
    <Layout
      activeItem="monitoring/concerns"
      breadcrumbs={["Barangay Captain", "Parent Concerns"]}
      onNavigate={(path) => navigate(`/${path}`)}
    >
      <div className="space-y-6 p-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <PageHeader
            title="Parent Concerns"
            subtitle="Acknowledge, respond to, and resolve parent concerns for Bonuan Sabangan."
          />
          <Button
            onClick={() => void listQuery.refetch()}
            disabled={listQuery.isFetching}
            icon={
              <RefreshCw
                className={`h-4 w-4 ${listQuery.isFetching ? "animate-spin" : ""}`}
              />
            }
          >
            {listQuery.isFetching ? "Refreshing" : "Refresh"}
          </Button>
        </div>

        <div className="flex flex-wrap gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <label className="space-y-1">
            <span className="block text-xs font-semibold uppercase text-gray-500 dark:text-slate-400">
              Status
            </span>
            <SelectFilter
              value={status}
              onChange={(value) => {
                setPage(1);
                setStatus(value as ConcernStatus | "all");
              }}
              options={[
                { value: "all", label: "All statuses" },
                ...CONCERN_STATUSES,
              ]}
            />
          </label>
          <label className="space-y-1">
            <span className="block text-xs font-semibold uppercase text-gray-500 dark:text-slate-400">
              Category
            </span>
            <SelectFilter
              value={category}
              onChange={(value) => {
                setPage(1);
                setCategory(value as ConcernCategory | "all");
              }}
              options={[
                { value: "all", label: "All categories" },
                ...CONCERN_CATEGORIES,
              ]}
            />
          </label>
        </div>

        {listQuery.error && (
          <ErrorAlert
            message={
              listQuery.error instanceof Error
                ? listQuery.error.message
                : "Unable to load parent concerns."
            }
          />
        )}

        <div className="grid gap-6 xl:grid-cols-[minmax(360px,0.9fr)_minmax(0,1.5fr)]">
          <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <div className="border-b border-gray-200 px-5 py-4 dark:border-slate-700">
              <h2 className="font-semibold text-gray-900 dark:text-slate-100">
                Concern Inbox
              </h2>
            </div>
            {listQuery.isLoading ? (
              <div className="space-y-3 p-4">
                {Array.from({ length: 5 }, (_, index) => (
                  <Skeleton key={index} className="h-28 rounded-xl" />
                ))}
              </div>
            ) : (listQuery.data?.data.length ?? 0) === 0 ? (
              <div className="flex min-h-80 flex-col items-center justify-center p-8 text-center">
                <Inbox className="h-10 w-10 text-gray-400" />
                <p className="mt-3 font-medium text-gray-800 dark:text-slate-100">
                  No concerns found
                </p>
                <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
                  New parent concerns will appear here.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-slate-800">
                {listQuery.data?.data.map((item) => (
                  <button
                    key={item._id}
                    type="button"
                    onClick={() => selectConcern(item._id)}
                    className={`w-full cursor-pointer p-4 text-left transition-colors hover:bg-gray-50 dark:hover:bg-slate-800 ${selectedId === item._id ? "bg-teal-50 dark:bg-teal-900/20" : ""}`}
                    aria-label={`Open ${item.subject}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-semibold text-gray-900 dark:text-slate-100">
                        {item.subject}
                      </p>
                      <span
                        className={`shrink-0 rounded-full px-2 py-1 text-xs font-semibold ${STATUS_CLASSES[item.status]}`}
                      >
                        {concernStatusLabel(item.status)}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-teal-700 dark:text-teal-300">
                      {concernCategoryLabel(item.category)}
                    </p>
                    <p className="mt-1 text-sm text-gray-600 dark:text-slate-300">
                      {formatName(item.parent, "Parent")} ·{" "}
                      {item.child.firstName} {item.child.lastName}
                    </p>
                    <p className="mt-2 text-xs text-gray-500 dark:text-slate-400">
                      Updated {formatDate(item.lastActivityAt)}
                    </p>
                  </button>
                ))}
              </div>
            )}
            {listQuery.data?.pagination && (
              <Pagination
                page={page}
                totalPages={listQuery.data.pagination.totalPages}
                rangeLabel={rangeLabel}
                onPageChange={setPage}
                disabled={listQuery.isFetching}
              />
            )}
          </section>

          <section className="min-h-[36rem] rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            {!selectedId ? (
              <div className="flex h-full min-h-96 flex-col items-center justify-center text-center">
                <MessageSquare className="h-10 w-10 text-gray-400" />
                <p className="mt-3 font-medium text-gray-800 dark:text-slate-100">
                  Select a concern
                </p>
                <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
                  Choose a concern from the inbox to review its history.
                </p>
              </div>
            ) : detail.query.isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-24 rounded-xl" />
                <Skeleton className="h-64 rounded-xl" />
                <Skeleton className="h-32 rounded-xl" />
              </div>
            ) : detail.query.error || !concern ? (
              <div className="flex min-h-96 flex-col items-center justify-center text-center">
                <AlertCircle className="h-10 w-10 text-rose-500" />
                <p className="mt-3 font-medium text-gray-900 dark:text-slate-100">
                  Unable to load concern details
                </p>
                <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
                  {detail.query.error instanceof Error
                    ? detail.query.error.message
                    : "Concern not found."}
                </p>
                <Button
                  className="mt-4"
                  onClick={() => void detail.query.refetch()}
                >
                  Try again
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                <div>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900 dark:text-slate-100">
                        {concern.subject}
                      </h2>
                      <p className="mt-1 text-sm text-gray-600 dark:text-slate-300">
                        {formatName(concern.parent, "Parent")} ·{" "}
                        {concern.child.firstName} {concern.child.lastName} (
                        {concern.child.studentId || "No student ID"})
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-sm font-semibold ${STATUS_CLASSES[concern.status]}`}
                    >
                      {concernStatusLabel(concern.status)}
                    </span>
                  </div>
                  <p className="mt-2 text-sm font-medium text-teal-700 dark:text-teal-300">
                    {concernCategoryLabel(concern.category)}
                  </p>
                </div>

                <div>
                  <h3 className="mb-3 font-semibold text-gray-900 dark:text-slate-100">
                    Conversation
                  </h3>
                  <div className="max-h-96 space-y-3 overflow-y-auto rounded-xl bg-gray-50 p-4 dark:bg-slate-800/60">
                    {concern.messages.map((message) => {
                      const fromCaptain =
                        message.senderRole === "barangay_captain";
                      return (
                        <div
                          key={message._id}
                          className={`max-w-[85%] rounded-xl p-3 ${fromCaptain ? "ml-auto bg-teal-600 text-white" : "border border-gray-200 bg-white text-gray-800 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"}`}
                        >
                          <p
                            className={`text-xs font-semibold ${fromCaptain ? "text-teal-100" : "text-teal-700 dark:text-teal-300"}`}
                          >
                            {formatName(
                              message.sender,
                              fromCaptain ? "Barangay Captain" : "Parent",
                            )}
                          </p>
                          <p className="mt-1 whitespace-pre-wrap text-sm">
                            {message.body}
                          </p>
                          <p
                            className={`mt-2 text-xs ${fromCaptain ? "text-teal-100" : "text-gray-500 dark:text-slate-400"}`}
                          >
                            {formatDate(message.createdAt)}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {concern.status !== "closed" && (
                  <div>
                    <label
                      className="text-sm font-semibold text-gray-700 dark:text-slate-200"
                      htmlFor="captain-reply"
                    >
                      Reply to parent
                    </label>
                    <textarea
                      id="captain-reply"
                      value={reply}
                      onChange={(event) => setReply(event.target.value)}
                      maxLength={2000}
                      rows={4}
                      className="mt-2 w-full rounded-lg border border-gray-300 bg-white p-3 text-sm text-gray-900 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/30 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                      placeholder="Write an official response"
                    />
                    {detail.replyMutation.error && (
                      <p className="mt-2 text-sm text-rose-600">
                        {detail.replyMutation.error instanceof Error
                          ? detail.replyMutation.error.message
                          : "Unable to send reply."}
                      </p>
                    )}
                    <Button
                      variant="primary"
                      className="mt-3"
                      icon={<Send className="h-4 w-4" />}
                      loading={detail.replyMutation.isPending}
                      disabled={!reply.trim()}
                      onClick={() => void submitReply()}
                    >
                      Send Reply
                    </Button>
                  </div>
                )}

                <div className="border-t border-gray-200 pt-5 dark:border-slate-700">
                  <h3 className="font-semibold text-gray-900 dark:text-slate-100">
                    Status history
                  </h3>
                  <div className="mt-3 space-y-3">
                    {concern.statusHistory.map((item) => (
                      <div
                        key={item._id}
                        className="rounded-lg border border-gray-200 p-3 dark:border-slate-700"
                      >
                        <p className="text-sm font-semibold text-gray-900 dark:text-slate-100">
                          {concernStatusLabel(item.newStatus)}
                        </p>
                        <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">
                          {formatName(
                            item.changedBy,
                            item.changedByRole === "parent"
                              ? "Parent"
                              : "Barangay Captain",
                          )}{" "}
                          · {formatDate(item.changedAt)}
                        </p>
                        {item.note && (
                          <p className="mt-2 text-sm text-gray-700 dark:text-slate-300">
                            {item.note}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                  {nextStatus && (
                    <div className="mt-4">
                      {(nextStatus === "resolved" ||
                        nextStatus === "closed") && (
                        <textarea
                          value={statusNote}
                          onChange={(event) =>
                            setStatusNote(event.target.value)
                          }
                          maxLength={1000}
                          rows={3}
                          className="mb-3 w-full rounded-lg border border-gray-300 bg-white p-3 text-sm text-gray-900 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/30 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                          placeholder="Optional resolution or closure note"
                          aria-label="Status note"
                        />
                      )}
                      {detail.statusMutation.error && (
                        <p className="mb-2 text-sm text-rose-600">
                          {detail.statusMutation.error instanceof Error
                            ? detail.statusMutation.error.message
                            : "Unable to update status."}
                        </p>
                      )}
                      <Button
                        variant="primary"
                        loading={detail.statusMutation.isPending}
                        onClick={() => void advanceStatus()}
                      >
                        Mark as {concernStatusLabel(nextStatus)}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </Layout>
  );
}
