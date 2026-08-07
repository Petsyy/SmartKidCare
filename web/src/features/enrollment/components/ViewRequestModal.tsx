import { useState, type ReactNode } from "react";
import { X, ClipboardList, Users, UserCircle, XCircle } from "lucide-react";
import type { EnrollmentRequestItem } from "@/api/admin.api";
import { formatSubmissionId } from "../hooks/useEnrollmentRequests";
import {
  formatDateLabel,
  formatLabelValue,
  formatName,
  statusClassName,
} from "./EnrollmentTable";

function getNutritionalStatusColor(status?: string | null) {
  if (!status) return "bg-gray-100 text-gray-700 dark:bg-slate-800 dark:text-slate-300";
  if (status === "Normal") return "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300";
  if (status === "Underweight") return "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300";
  return "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300";
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
    <section className="relative overflow-hidden rounded-2xl border border-gray-200/60 bg-white/40 p-5 shadow-sm backdrop-blur-xl dark:border-slate-700/50 dark:bg-slate-900/40">
      <div className="relative z-10 mb-5 flex items-center gap-3 border-b border-gray-100 pb-3 dark:border-slate-800">
        <div className="rounded-lg bg-teal-100/50 p-1.5 text-teal-600 shadow-sm dark:bg-teal-500/20 dark:text-teal-400">
          {Icon && <Icon className="h-4 w-4" />}
        </div>
        <h4 className="text-sm font-bold tracking-wide text-gray-900 dark:text-slate-100">
          {title}
        </h4>
      </div>
      <div className="relative z-10">{children}</div>
    </section>
  );
}

function DetailRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex flex-col justify-center rounded-xl border border-gray-100 bg-white p-4 shadow-sm dark:border-slate-700/60 dark:bg-slate-800/80">
      <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-teal-600/70 dark:text-teal-400/70">
        {label}
      </p>
      <div className="text-sm font-medium text-gray-800 dark:text-slate-200">
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
    <div className="flex items-center justify-between rounded-xl border border-gray-100 bg-white px-4 py-3.5 shadow-sm dark:border-slate-700/60 dark:bg-slate-800/80">
      <span className="text-sm font-semibold text-gray-800 dark:text-slate-200">
        {label}
      </span>
      <span
        className={`inline-flex rounded-full px-3 py-1 text-xs font-bold shadow-sm ${
          uploaded
            ? "border border-emerald-200/60 bg-emerald-100 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/20 dark:text-emerald-300"
            : "border border-rose-200/60 bg-rose-100 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/20 dark:text-rose-300"
        }`}
      >
        {uploaded ? "Uploaded" : "Missing"}
      </span>
    </div>
  );
}

type ViewRequestModalProps = {
  selectedRequest: EnrollmentRequestItem;
  processingId: string | null;
  onClose: () => void;
  onReject: (request: EnrollmentRequestItem) => void;
  onApprove: (request: EnrollmentRequestItem) => void;
};

export const ViewRequestModal = ({
  selectedRequest,
  processingId,
  onClose,
  onReject,
  onApprove,
}: ViewRequestModalProps) => {
  const [activeTab, setActiveTab] = useState<"overview" | "child" | "parent">("overview");

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-black/50 p-4 sm:p-6"
      onClick={(event) => event.target === event.currentTarget && onClose()}
    >
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] w-full max-w-3xl items-center justify-center sm:min-h-[calc(100vh-3rem)]">
        <div
          className="flex max-h-[min(90vh,820px)] w-full flex-col overflow-hidden rounded-xl bg-white shadow-xl dark:bg-slate-900"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="sticky top-0 z-10 flex items-center justify-between border-b border-teal-200 bg-teal-50 p-6 dark:border-teal-900/50 dark:bg-teal-900/20">
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-teal-100 p-2.5 text-teal-600 dark:bg-teal-900/40 dark:text-teal-400">
                <ClipboardList size={22} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-50">
                  View Submission
                </h3>
                <p className="text-sm text-gray-500 dark:text-slate-400">
                  {formatSubmissionId(selectedRequest._id)}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 dark:text-slate-500 dark:hover:bg-slate-700 dark:hover:text-slate-300"
              aria-label="Close details"
            >
              <X size={20} />
            </button>
          </div>

          <div className="flex border-b border-gray-200 px-6 pt-2 dark:border-slate-700 dark:bg-slate-900">
            <button
              onClick={() => setActiveTab("overview")}
              className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${
                activeTab === "overview"
                  ? "border-teal-500 text-teal-700 dark:border-teal-400 dark:text-teal-400"
                  : "border-transparent text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-200"
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab("child")}
              className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${
                activeTab === "child"
                  ? "border-teal-500 text-teal-700 dark:border-teal-400 dark:text-teal-400"
                  : "border-transparent text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-200"
              }`}
            >
              Child Info
            </button>
            <button
              onClick={() => setActiveTab("parent")}
              className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${
                activeTab === "parent"
                  ? "border-teal-500 text-teal-700 dark:border-teal-400 dark:text-teal-400"
                  : "border-transparent text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-200"
              }`}
            >
              Parent & Docs
            </button>
          </div>

          <div className="flex-1 overflow-y-auto bg-white px-6 py-5 dark:bg-slate-900">
            {activeTab === "overview" && (
              <div className="space-y-6 pb-1 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <DetailSection title="Submission Overview" icon={ClipboardList}>
                <div className="grid gap-4 sm:grid-cols-2">
                  <DetailRow
                    label="Submission ID"
                    value={formatSubmissionId(selectedRequest._id)}
                  />
                  <DetailRow
                    label="Status"
                    value={
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-bold capitalize shadow-sm ${
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

              {selectedRequest.review?.reason && (
                <DetailSection title="Review Notes" icon={XCircle}>
                  <DetailRow
                    label="Reason"
                    value={selectedRequest.review.reason}
                  />
                </DetailSection>
              )}
            </div>
            )}

            {activeTab === "child" && (
            <div className="space-y-6 pb-1 animate-in fade-in slide-in-from-bottom-2 duration-300">
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
                    value={formatDateLabel(selectedRequest.child.dateOfBirth)}
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
                    value={formatLabelValue(selectedRequest.child.programType)}
                  />
                  <DetailRow
                    label="Weight & Height"
                    value={
                      selectedRequest.child.weight
                        ? `${selectedRequest.child.weight} kg / ${selectedRequest.child.height} cm`
                        : "Not provided"
                    }
                  />
                  <DetailRow
                    label="BMI"
                    value={selectedRequest.child.bmi ?? "N/A"}
                  />
                  <DetailRow
                    label="Nutritional Status"
                    value={
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${getNutritionalStatusColor(
                          selectedRequest.child.nutritionalStatus
                        )}`}
                      >
                        {selectedRequest.child.nutritionalStatus || "N/A"}
                      </span>
                    }
                  />
                  <DetailRow
                    label="School Year"
                    value={selectedRequest.child.schoolYear}
                  />
                </div>
              </DetailSection>
            </div>
            )}

            {activeTab === "parent" && (
            <div className="space-y-6 pb-1 animate-in fade-in slide-in-from-bottom-2 duration-300">
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
            </div>
            )}
          </div>

          <div className="sticky bottom-0 flex flex-wrap items-center justify-end gap-3 border-t border-gray-200 bg-white px-6 py-4 dark:border-slate-700 dark:bg-slate-900">
            {selectedRequest.status === "pending" ? (
              <>
                <button
                  onClick={() => onReject(selectedRequest)}
                  disabled={processingId === selectedRequest._id}
                  className={`cursor-pointer inline-flex items-center justify-center rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-rose-500/30 ${
                    processingId === selectedRequest._id
                      ? "cursor-not-allowed bg-rose-400 opacity-70"
                      : "bg-rose-600 hover:bg-rose-700"
                  }`}
                >
                  Reject
                </button>
                <button
                  onClick={() => onApprove(selectedRequest)}
                  disabled={processingId === selectedRequest._id}
                  className={`cursor-pointer inline-flex items-center justify-center rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 ${
                    processingId === selectedRequest._id
                      ? "cursor-not-allowed bg-emerald-400 opacity-70"
                      : "bg-emerald-600 hover:bg-emerald-700"
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
  );
};
