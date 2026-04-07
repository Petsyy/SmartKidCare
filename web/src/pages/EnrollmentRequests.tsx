import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import {
  Eye,
  MoreVertical,
  Trash2,
  X,
  ClipboardList,
  Clock,
  CheckCircle,
  XCircle,
  Filter,
  Search,
  Users,
  UserCircle,
} from "lucide-react";
import Swal from "sweetalert2";
import Layout from "@/components/layout/Layout";
import {
  deleteEnrollmentRequest,
  getEnrollmentRequests,
  reviewEnrollmentRequest,
  type EnrollmentRequestItem,
  type EnrollmentRequestStatus,
} from "@/api/admin.api";
import {
  showErrorModal,
  showParentCredentialsModal,
} from "@/utils/sweetAlertModal";

const formatDateLabel = (value: string | Date) => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "N/A";
  return parsed.toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "Asia/Manila",
  });
};

const formatName = (person: {
  firstName?: string;
  middleName?: string;
  lastName?: string;
}): string => {
  return [person.firstName, person.middleName, person.lastName]
    .filter((value) => String(value || "").trim().length > 0)
    .join(" ");
};

const formatSubmissionId = (value: string) =>
  `ER-${String(value || "")
    .slice(-6)
    .toUpperCase()}`;

const statusClassName: Record<EnrollmentRequestStatus, string> = {
  pending:
    "border border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/15 dark:text-amber-300",
  approved:
    "border border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-300",
  rejected:
    "border border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/15 dark:text-rose-300",
};

const formatLabelValue = (value?: string | null) => {
  if (!value || !String(value).trim()) return "Not set";
  return value
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
};

export default function EnrollmentRequests() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState<EnrollmentRequestItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [selectedRequest, setSelectedRequest] =
    useState<EnrollmentRequestItem | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] =
    useState<EnrollmentRequestStatus>("pending");
  const menuRef = useRef<HTMLDivElement | null>(null);

  const refreshRequests = async () => {
    setLoading(true);
    try {
      const items = await getEnrollmentRequests(statusFilter);
      setRequests(items);
    } catch (error: any) {
      showErrorModal(error?.message || "Failed to load enrollment requests");
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refreshRequests();
  }, [statusFilter]);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(event.target as Node)) {
        setOpenMenuId(null);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const stats = useMemo(() => {
    const pending = requests.filter((item) => item.status === "pending").length;
    const approved = requests.filter(
      (item) => item.status === "approved",
    ).length;

    const rejected = requests.filter(
      (item) => item.status === "rejected",
    ).length;
    return { total: requests.length, pending, approved, rejected };
  }, [requests]);

  const handleApprove = async (request: EnrollmentRequestItem) => {
    const result = await Swal.fire({
      title: "Approve Enrollment Request?",
      text: `Approve submission ${formatSubmissionId(request._id)} and create an official child record?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Approve",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#059669",
      cancelButtonColor: "#6B7280",
    });

    if (!result.isConfirmed) return;

    setProcessingId(request._id);
    try {
      const response = await reviewEnrollmentRequest(request._id, "approved");
      await Swal.fire({
        title: "Approved",
        text: response.message,
        icon: "success",
        confirmButtonColor: "#0D9488",
      });

      if (response.parentCredentials?.tempPassword) {
        showParentCredentialsModal({
          email: response.parentCredentials.email,
          password: response.parentCredentials.tempPassword,
        });
      }

      await refreshRequests();
    } catch (error: any) {
      showErrorModal(error?.message || "Failed to approve request");
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (request: EnrollmentRequestItem) => {
    const result = await Swal.fire({
      title: "Reject Enrollment Request?",
      text: `Reject submission ${formatSubmissionId(request._id)}?`,
      icon: "warning",
      input: "text",
      inputLabel: "Reason (optional)",
      inputPlaceholder: "Explain why this request is rejected...",
      showCancelButton: true,
      confirmButtonText: "Reject",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#DC2626",
      cancelButtonColor: "#6B7280",
    });

    if (!result.isConfirmed) return;

    setProcessingId(request._id);
    try {
      const reason = typeof result.value === "string" ? result.value : "";
      const response = await reviewEnrollmentRequest(
        request._id,
        "rejected",
        reason,
      );
      await Swal.fire({
        title: "Rejected",
        text: response.message,
        icon: "success",
        confirmButtonColor: "#0D9488",
      });
      await refreshRequests();
    } catch (error: any) {
      showErrorModal(error?.message || "Failed to reject request");
    } finally {
      setProcessingId(null);
    }
  };

  const handleDelete = async (request: EnrollmentRequestItem) => {
    setOpenMenuId(null);

    const result = await Swal.fire({
      title: "Delete Enrollment Request?",
      text: `Delete submission ${formatSubmissionId(request._id)}? This cannot be undone.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Delete",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#DC2626",
      cancelButtonColor: "#6B7280",
    });

    if (!result.isConfirmed) return;

    setProcessingId(request._id);
    try {
      const response = await deleteEnrollmentRequest(request._id);
      await Swal.fire({
        title: "Deleted",
        text: response.message,
        icon: "success",
        confirmButtonColor: "#0D9488",
      });
      if (selectedRequest?._id === request._id) {
        setSelectedRequest(null);
      }
      await refreshRequests();
    } catch (error: any) {
      showErrorModal(error?.message || "Failed to delete request");
    } finally {
      setProcessingId(null);
    }
  };
  return (
    <Layout
      activeItem="enrollment-requests"
      breadcrumbs={["Admin", "Enrollment Requests"]}
      onNavigate={(path) => navigate(`/${path}`)}
    >
      <div className="space-y-6 p-8">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-slate-100">
            Enrollment Requests
          </h1>
          <p className="text-sm text-gray-500 dark:text-slate-400">
            Review child enrollment submissions from teachers and centers.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Total"
            value={stats.total}
            icon={ClipboardList}
            color="blue"
          />
          <StatCard
            title="Pending"
            value={stats.pending}
            icon={Clock}
            color="teal"
          />
          <StatCard
            title="Approved"
            value={stats.approved}
            icon={CheckCircle}
            color="emerald"
          />
          <StatCard
            title="Rejected"
            value={stats.rejected}
            icon={XCircle}
            color="rose"
          />
        </div>

        <div className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-col gap-4 border-b border-gray-200 p-6 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-gray-400" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100">
                Review Queue
              </h2>
            </div>
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search..."
                  className="rounded-lg border border-gray-200 bg-gray-50 pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600 dark:text-slate-300">
                  Status
                </label>
                <select
                  value={statusFilter}
                  onChange={(event) =>
                    setStatusFilter(
                      event.target.value as EnrollmentRequestStatus,
                    )
                  }
                  className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                >
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="px-6 py-14 text-center text-gray-500 dark:text-slate-400">
              Loading enrollment requests...
            </div>
          ) : requests.length === 0 ? (
            <div className="px-6 py-14 text-center text-gray-500 dark:text-slate-400">
              No {statusFilter} requests found.
            </div>
          ) : (
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
                            {request.createdChild?.studentId ||
                              "Student ID pending"}
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
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium capitalize ${
                              statusClassName[request.status]
                            }`}
                          >
                            {request.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 align-top text-sm text-gray-700 dark:text-slate-300">
                          {formatDateLabel(request.createdAt)}
                        </td>
                        <td className="px-6 py-4 align-top">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <button
                              onClick={() => setSelectedRequest(request)}
                              className="group inline-flex items-center gap-1.5 rounded-lg border border-teal-200 bg-teal-50 px-3 py-1.5 text-xs font-semibold text-teal-700 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-teal-300 hover:bg-teal-100 hover:shadow focus:outline-none focus:ring-2 focus:ring-teal-500/30 dark:border-teal-900/50 dark:bg-teal-900/20 dark:text-teal-300 dark:hover:bg-teal-900/40"
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
                                  onClick={() => void handleApprove(request)}
                                  disabled={isProcessing}
                                  className={`inline-flex items-center justify-center rounded-lg px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 ${
                                    isProcessing
                                      ? "cursor-not-allowed bg-emerald-300"
                                      : "bg-emerald-600 hover:-translate-y-0.5 hover:bg-emerald-700 hover:shadow"
                                  }`}
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() => void handleReject(request)}
                                  disabled={isProcessing}
                                  className={`inline-flex items-center justify-center rounded-lg px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-rose-500/30 ${
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
                            <div
                              className="relative"
                              ref={openMenuId === request._id ? menuRef : null}
                            >
                              <button
                                onClick={() =>
                                  setOpenMenuId((current) =>
                                    current === request._id
                                      ? null
                                      : request._id,
                                  )
                                }
                                className="inline-flex items-center justify-center rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1.5 text-xs font-semibold text-gray-700 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-gray-300 hover:bg-gray-100 hover:shadow focus:outline-none focus:ring-2 focus:ring-gray-400/30 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-500 dark:hover:bg-slate-800"
                                title="More actions"
                                aria-label="More actions"
                              >
                                <MoreVertical size={14} />
                              </button>

                              {openMenuId === request._id ? (
                                <div className="absolute right-0 top-10 z-20 min-w-42.5 rounded-xl border border-gray-200 bg-white p-1.5 shadow-xl dark:border-slate-700 dark:bg-slate-900">
                                  <button
                                    onClick={() => void handleDelete(request)}
                                    disabled={
                                      isProcessing ||
                                      request.status === "approved"
                                    }
                                    className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium transition ${
                                      isProcessing ||
                                      request.status === "approved"
                                        ? "cursor-not-allowed text-gray-400 dark:text-slate-500"
                                        : "text-rose-600 hover:bg-rose-50 dark:text-rose-300 dark:hover:bg-rose-500/10"
                                    }`}
                                  >
                                    <Trash2 size={14} />
                                    {request.status === "approved"
                                      ? "Delete unavailable"
                                      : "Delete request"}
                                  </button>
                                </div>
                              ) : null}
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {selectedRequest && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto bg-black/50 p-4 sm:p-6"
          onClick={() => setSelectedRequest(null)}
        >
          <div className="mx-auto flex min-h-[calc(100vh-2rem)] w-full max-w-3xl items-center justify-center sm:min-h-[calc(100vh-3rem)]">
            <div
              className="flex max-h-[min(90vh,820px)] w-full flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4 dark:border-slate-700 dark:bg-slate-900">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-teal-50 p-2 dark:bg-teal-500/10 text-teal-600 dark:text-teal-400">
                    <ClipboardList size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100">
                      Submission Details
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-slate-400">
                      {formatSubmissionId(selectedRequest._id)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedRequest(null)}
                  className="rounded-md p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-700 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100"
                  aria-label="Close details"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-6 py-5">
                <div className="space-y-6 pb-1">
                  <DetailSection
                    title="Submission Overview"
                    icon={ClipboardList}
                  >
                    <div className="grid gap-4 sm:grid-cols-2">
                      <DetailRow
                        label="Submission ID"
                        value={formatSubmissionId(selectedRequest._id)}
                      />
                      <DetailRow
                        label="Status"
                        value={
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium capitalize ${
                              statusClassName[selectedRequest.status]
                            }`}
                          >
                            {selectedRequest.status}
                          </span>
                        }
                      />
                      <DetailRow
                        label="Submitted At"
                        value={formatDateLabel(selectedRequest.createdAt)}
                      />
                      <DetailRow
                        label="Student ID"
                        value={
                          selectedRequest.createdChild?.studentId ||
                          "Pending assignment"
                        }
                      />
                    </div>
                  </DetailSection>

                  <DetailSection title="Teacher & Center" icon={Users}>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <DetailRow
                        label="Submitted By"
                        value={
                          <>
                            <div className="font-medium">
                              {selectedRequest.requestedBy
                                ? formatName(selectedRequest.requestedBy)
                                : "Unknown Teacher"}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-slate-400">
                              {selectedRequest.requestedBy?.email || "No email"}
                            </div>
                          </>
                        }
                      />
                      <DetailRow
                        label="Assigned Center"
                        value={
                          <>
                            <div className="font-medium">
                              {selectedRequest.daycareCenter?.name ||
                                "Unassigned Center"}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-slate-400">
                              {selectedRequest.daycareCenter?.barangay ||
                                "No barangay"}
                            </div>
                          </>
                        }
                      />
                    </div>
                  </DetailSection>

                  <DetailSection title="Child Eligibility" icon={UserCircle}>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      <DetailRow
                        label="Enrollment Date"
                        value={formatDateLabel(
                          selectedRequest.child.enrollmentDate,
                        )}
                      />
                      <DetailRow
                        label="Date of Birth"
                        value={formatDateLabel(
                          selectedRequest.child.dateOfBirth,
                        )}
                      />
                      <DetailRow
                        label="Age"
                        value={String(selectedRequest.child.age)}
                      />
                      <DetailRow
                        label="Gender"
                        value={formatLabelValue(selectedRequest.child.gender)}
                      />
                      <DetailRow
                        label="Program Type"
                        value={selectedRequest.child.programType || "Not set"}
                      />
                      <DetailRow
                        label="School Year"
                        value={selectedRequest.child.schoolYear}
                      />
                    </div>
                  </DetailSection>

                  <DetailSection title="Parent & Documents" icon={Users}>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <DetailRow
                        label="Parent Name"
                        value={formatName(selectedRequest.parent)}
                      />
                      <DetailRow
                        label="Parent Contact"
                        value={
                          <>
                            <div className="font-medium">
                              {selectedRequest.parent.phone || "No phone"}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-slate-400">
                              {selectedRequest.parent.email || "No email"}
                            </div>
                          </>
                        }
                      />
                    </div>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <DocumentStatusRow
                        label="Birth Certificate"
                        uploaded={Boolean(
                          selectedRequest.documents?.birthCertificate?.publicId,
                        )}
                      />
                      <DocumentStatusRow
                        label="Parent ID"
                        uploaded={Boolean(
                          selectedRequest.documents?.parentId?.publicId,
                        )}
                      />
                    </div>
                  </DetailSection>

                  {selectedRequest.review?.reason ? (
                    <DetailSection title="Review Notes" icon={XCircle}>
                      <DetailRow
                        label="Reason"
                        value={selectedRequest.review.reason}
                      />
                    </DetailSection>
                  ) : null}
                </div>
              </div>

              <div className="sticky bottom-0 flex flex-wrap items-center justify-end gap-2 border-t border-gray-200 bg-white px-6 py-4 dark:border-slate-700 dark:bg-slate-900">
                <button
                  onClick={() => setSelectedRequest(null)}
                  className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-400/30 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  Close
                </button>
                {selectedRequest.status === "pending" ? (
                  <>
                    <button
                      onClick={() => void handleReject(selectedRequest)}
                      disabled={processingId === selectedRequest._id}
                      className={`inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-rose-500/30 ${
                        processingId === selectedRequest._id
                          ? "cursor-not-allowed bg-rose-300"
                          : "bg-rose-600 hover:-translate-y-0.5 hover:bg-rose-700 hover:shadow"
                      }`}
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => void handleApprove(selectedRequest)}
                      disabled={processingId === selectedRequest._id}
                      className={`inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 ${
                        processingId === selectedRequest._id
                          ? "cursor-not-allowed bg-emerald-300"
                          : "bg-emerald-600 hover:-translate-y-0.5 hover:bg-emerald-700 hover:shadow"
                      }`}
                    >
                      Approve
                    </button>
                  </>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}

function DetailSection({
  title,
  children,
  icon: Icon,
}: {
  title: string;
  children: ReactNode;
  icon?: any;
}) {
  return (
    <section className="rounded-xl border border-gray-200 bg-gray-50/60 p-5 dark:border-slate-700 dark:bg-slate-950/40">
      <div className="flex items-center gap-2 mb-4">
        {Icon && <Icon className="h-4 w-4 text-teal-600 dark:text-teal-400" />}
        <h4 className="text-sm font-semibold text-gray-900 dark:text-slate-100">
          {title}
        </h4>
      </div>
      <div className="">{children}</div>
    </section>
  );
}

function DetailRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400">
        {label}
      </p>
      <div className="mt-2 text-sm text-gray-900 dark:text-slate-100">
        {value}
      </div>
    </div>
  );
}

function DocumentStatusRow({
  label,
  uploaded,
}: {
  label: string;
  uploaded: boolean;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-900">
      <span className="text-sm font-medium text-gray-900 dark:text-slate-100">
        {label}
      </span>
      <span
        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
          uploaded
            ? "border border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-300"
            : "border border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/15 dark:text-rose-300"
        }`}
      >
        {uploaded ? "Uploaded" : "Missing"}
      </span>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon: Icon,
  color = "blue",
}: {
  title: string;
  value: number;
  icon: any;
  color?: "blue" | "teal" | "emerald" | "rose";
}) {
  const colorMap = {
    blue: "bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300",
    teal: "bg-teal-50 text-teal-600 dark:bg-teal-500/15 dark:text-teal-300",
    emerald:
      "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300",
    rose: "bg-rose-50 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300",
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 dark:text-slate-400">
            {title}
          </p>
          <div className="mt-2 flex items-baseline gap-2">
            <p className="text-3xl font-semibold text-gray-900 dark:text-slate-100">
              {value}
            </p>
          </div>
        </div>
        <div className={`rounded-lg p-3 ${colorMap[color]}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
}
