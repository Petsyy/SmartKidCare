import { Eye, MoreVertical } from "lucide-react";
import type {
  EnrollmentRequestItem,
  EnrollmentRequestStatus,
} from "@/api/admin.api";
import { formatSubmissionId } from "../hooks/useEnrollmentRequests";

export const formatDateLabel = (value: string | Date) => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "N/A";
  return parsed.toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "Asia/Manila",
  });
};

export const formatName = (person: {
  firstName?: string;
  middleName?: string;
  lastName?: string;
}): string => {
  return [person.firstName, person.middleName, person.lastName]
    .filter((value) => String(value || "").trim().length > 0)
    .join(" ");
};

export const statusClassName: Record<EnrollmentRequestStatus, string> = {
  pending:
    "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-200",
  approved:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200",
  rejected: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-200",
};

export const formatLabelValue = (value?: string | null) => {
  if (!value || !String(value).trim()) return "Not set";
  return value
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
};

type EnrollmentTableProps = {
  requests: EnrollmentRequestItem[];
  loading: boolean;
  statusFilter: EnrollmentRequestStatus;
  processingId: string | null;
  openMenuId: string | null;
  onOpenMenu: (
    request: EnrollmentRequestItem,
    buttonEl: HTMLButtonElement,
  ) => void;
  onSetSelectedRequest: (request: EnrollmentRequestItem | null) => void;
  onApprove: (request: EnrollmentRequestItem) => void;
  onReject: (request: EnrollmentRequestItem) => void;
  onDelete: (request: EnrollmentRequestItem) => void;
};

export const EnrollmentTable = ({
  requests,
  loading,
  statusFilter,
  processingId,
  onOpenMenu,
  onSetSelectedRequest,
  onApprove,
  onReject,
}: EnrollmentTableProps) => {
  if (loading) {
    return (
      <div className="px-6 py-14 text-center text-gray-500 dark:text-slate-400">
        Loading enrollment requests...
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="px-6 py-14 text-center text-gray-500 dark:text-slate-400">
        No {statusFilter} requests found.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead className="border-b bg-gray-50/50 dark:border-slate-700 dark:bg-slate-900/50">
          <tr>
            <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400">
              Submission ID
            </th>
            <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400">
              Submitted By
            </th>
            <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400">
              Assigned Center
            </th>
            <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400">
              Status
            </th>
            <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400">
              Submitted At
            </th>
            <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
          {requests.map((request) => {
            const teacherName = request.requestedBy
              ? formatName(request.requestedBy)
              : "Unknown Teacher";
            const centerName =
              request.daycareCenter?.name || "Unassigned Center";
            const centerBarangay =
              request.daycareCenter?.barangay || "No barangay";
            const isProcessing = processingId === request._id;

            return (
              <tr
                key={request._id}
                className="transition-colors hover:bg-gray-50 dark:hover:bg-slate-800/60"
              >
                <td className="px-6 py-4 align-top">
                  <div className="text-sm font-semibold text-gray-900 dark:text-slate-100">
                    {formatSubmissionId(request._id)}
                  </div>
                  <div className="mt-1 text-xs text-gray-500 dark:text-slate-400">
                    {request.createdChild?.studentId || "Student ID pending"}
                  </div>
                </td>
                <td className="px-6 py-4 align-top">
                  <div className="text-sm font-medium text-gray-900 dark:text-slate-100">
                    {teacherName}
                  </div>
                  <div className="mt-1 text-xs text-gray-500 dark:text-slate-400">
                    {request.requestedBy?.email || "No email"}
                  </div>
                </td>
                <td className="px-6 py-4 align-top">
                  <div className="text-sm font-medium text-gray-900 dark:text-slate-100">
                    {centerName}
                  </div>
                  <div className="mt-1 text-xs text-gray-500 dark:text-slate-400">
                    {centerBarangay}
                  </div>
                </td>
                <td className="px-6 py-4 align-top">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold capitalize ${
                      statusClassName[request.status]
                    }`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        request.status === "approved"
                          ? "bg-emerald-500"
                          : request.status === "rejected"
                            ? "bg-rose-500"
                            : "bg-amber-500"
                      }`}
                    />
                    {request.status}
                  </span>
                </td>
                <td className="px-6 py-4 align-top text-sm text-gray-700 dark:text-slate-300">
                  {formatDateLabel(request.createdAt)}
                </td>
                <td className="px-6 py-4 align-top">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      onClick={() => onSetSelectedRequest(request)}
                      className="group inline-flex items-center gap-1.5 rounded-lg border border-teal-200 bg-teal-50 px-3 py-1.5 text-xs font-semibold text-teal-700 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-teal-300 hover:bg-teal-100 hover:shadow focus:outline-none focus:ring-2 focus:ring-teal-500/30 dark:border-teal-900/50 dark:bg-teal-900/20 dark:text-teal-300 dark:hover:bg-teal-900/40 cursor-pointer"
                    >
                      <Eye
                        size={14}
                        className="transition-transform duration-200 group-hover:scale-110"
                      />
                      View
                    </button>
                    {request.status === "pending" ? (
                      <>
                        <button
                          onClick={() => onApprove(request)}
                          disabled={isProcessing}
                          className={`inline-flex items-center justify-center rounded-lg px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 cursor-pointer ${
                            isProcessing
                              ? "cursor-not-allowed bg-emerald-300"
                              : "bg-emerald-600 hover:-translate-y-0.5 hover:bg-emerald-700 hover:shadow"
                          }`}
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => onReject(request)}
                          disabled={isProcessing}
                          className={`inline-flex items-center justify-center rounded-lg px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-rose-500/30 cursor-pointer ${
                            isProcessing
                              ? "cursor-not-allowed bg-rose-300"
                              : "bg-rose-600 hover:-translate-y-0.5 hover:bg-rose-700 hover:shadow"
                          }`}
                        >
                          Reject
                        </button>
                      </>
                    ) : (
                      <span className="text-xs font-medium text-gray-500 dark:text-slate-400">
                        Reviewed
                      </span>
                    )}
                    <div className="relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenMenu(request, e.currentTarget);
                        }}
                        className="inline-flex items-center justify-center rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1.5 text-xs font-semibold text-gray-700 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-gray-300 hover:bg-gray-100 hover:shadow focus:outline-none focus:ring-2 focus:ring-gray-400/30 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-500 dark:hover:bg-slate-800 cursor-pointer"
                        title="More actions"
                        aria-label="More actions"
                      >
                        <MoreVertical size={14} />
                      </button>
                    </div>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
