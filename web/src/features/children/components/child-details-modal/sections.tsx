import {
  AlertCircle,
  ExternalLink,
  FileText,
  HeartPulse,
  Loader2,
  Mail,
  Phone,
  ShieldAlert,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import type { Child, ChildBlockchainProof, ChildDocumentType } from "@/types/child";
import {
  formatDate,
  formatFullName,
  formatMetric,
  formatTitleCase,
  formatTxDisplay,
  getNutritionalStatusColor,
} from "./utils";

function VerificationStatus({
  verified,
  loading = false,
}: {
  verified?: boolean;
  loading?: boolean;
}) {
  const classes = loading
    ? "border-slate-200/60 bg-slate-50 text-slate-600 dark:border-slate-600 dark:bg-slate-900/70 dark:text-slate-300"
    : verified === true
      ? "border-emerald-200/60 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300"
      : verified === false
        ? "border-amber-200/60 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300"
        : "border-slate-200/60 bg-slate-50 text-slate-600 dark:border-slate-600 dark:bg-slate-900/70 dark:text-slate-300";

  return (
    <p aria-live="polite" className={`inline-flex items-center justify-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-semibold shadow-sm ${classes}`}>
      {loading ? (
        <Loader2 size={14} className="animate-spin motion-reduce:animate-none" />
      ) : verified === true ? (
        <ShieldCheck size={14} />
      ) : (
        <ShieldAlert size={14} />
      )}
      {loading ? "Checking blockchain" : verified === true ? "Blockchain verified" : verified === false ? "Not verified" : "Not checked"}
    </p>
  );
}

function InfoCard({ label, value, subvalue }: { label: string; value: React.ReactNode; subvalue?: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-gray-200/70 bg-white p-4 shadow-sm dark:border-slate-700/60 dark:bg-slate-800/80">
      <p className="mb-1.5 text-[11px] font-bold uppercase tracking-[0.24em] text-teal-700/75 dark:text-teal-300/75">{label}</p>
      <div className="text-[15px] font-semibold leading-6 text-gray-800 dark:text-slate-200">{value}</div>
      {subvalue ? <div className="mt-1.5 text-xs font-medium text-gray-500 dark:text-slate-400">{subvalue}</div> : null}
    </div>
  );
}

function DocumentCard({
  label,
  description,
  isAvailable,
  isLoading,
  onOpen,
  verification,
}: {
  label: string;
  description: string;
  isAvailable: boolean;
  isLoading: boolean;
  onOpen: () => void;
  verification?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-gray-200/70 bg-white p-4 shadow-sm dark:border-slate-700/60 dark:bg-slate-800/80">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-gray-900 dark:text-slate-100">{label}</p>
          <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">{description}</p>
        </div>
        <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${isAvailable ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300" : "bg-slate-100 text-slate-600 dark:bg-slate-700/70 dark:text-slate-300"}`}>
          {isAvailable ? "Available" : "Not uploaded"}
        </span>
      </div>

      <div className="mt-4 flex flex-col gap-3">
        <button
          type="button"
          onClick={onOpen}
          disabled={isLoading || !isAvailable}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200/70 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transition-none dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          {isLoading ? <Loader2 size={16} className="animate-spin motion-reduce:animate-none" /> : <FileText size={16} className="text-teal-600 dark:text-teal-400" />}
          {isAvailable ? `View ${label}` : `${label} unavailable`}
        </button>
        <VerificationStatus verified={verification} loading={isLoading && isAvailable} />
      </div>
    </div>
  );
}

function ErrorAlert({
  tone,
  title,
  message,
}: {
  tone: "danger" | "warning";
  title: string;
  message: string;
}) {
  const toneClasses =
    tone === "danger"
      ? "border-rose-200/70 bg-rose-50 text-rose-800 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200"
      : "border-amber-200/70 bg-amber-50 text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200";

  const iconClasses =
    tone === "danger"
      ? "bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-300"
      : "bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-300";

  return (
    <div className={`rounded-2xl border px-4 py-3 shadow-sm ${toneClasses}`} role="alert">
      <div className="flex items-start gap-3">
        <div className={`mt-0.5 rounded-xl p-2 ${iconClasses}`}>
          <AlertCircle size={16} />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold">{title}</p>
          <p className="mt-1 text-sm/6 opacity-90">{message}</p>
        </div>
      </div>
    </div>
  );
}

function ContactCard({
  label,
  name,
  email,
  phone,
  emptyLabel,
}: {
  label: string;
  name: string;
  email?: string;
  phone?: string;
  emptyLabel: string;
}) {
  return (
    <div className="rounded-2xl border border-gray-200/70 bg-white p-4 shadow-sm dark:border-slate-700/60 dark:bg-slate-800/80">
      <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.18em] text-teal-700/75 dark:text-teal-300/75">{label}</p>
      {name === emptyLabel ? (
        <p className="text-sm font-medium text-gray-500 dark:text-slate-400">{emptyLabel}</p>
      ) : (
        <div className="space-y-3">
          <div className="flex items-start gap-2">
            <UserRound size={16} className="mt-0.5 shrink-0 text-teal-600 dark:text-teal-400" />
            <p className="text-[15px] font-semibold leading-6 text-gray-900 dark:text-slate-100">{name}</p>
          </div>
          {email ? (
            <a href={`mailto:${email}`} className="flex items-start gap-2 text-[15px] font-medium text-teal-700 underline-offset-2 hover:underline dark:text-teal-300">
              <Mail size={14} className="mt-0.5 shrink-0" />
              <span className="break-all">{email}</span>
            </a>
          ) : null}
          {phone ? (
            <div className="flex items-start gap-2 text-[15px] font-medium text-gray-500 dark:text-slate-400">
              <Phone size={14} className="mt-1 shrink-0 text-gray-400 dark:text-slate-500" />
              <span>{phone}</span>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

export function ProfileSection({ child, tabId }: { child: Child; tabId: string }) {
  return (
    <div id="profile-panel" role="tabpanel" aria-labelledby={tabId} className="space-y-4 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-300">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <InfoCard label="Student ID" value={<span className="font-mono">{child.studentId || "Not assigned"}</span>} />
        <InfoCard label="School Year" value={child.schoolYear || "Not set"} />
        <InfoCard label="Age" value={child.age || "Not set"} />
        <InfoCard label="Gender" value={formatTitleCase(child.gender)} />
        <InfoCard label="Enrollment Date" value={formatDate(child.enrollmentDate)} />
        <InfoCard label="Date of Birth" value={formatDate(child.dateOfBirth)} />
        <InfoCard label="Parent Relationship" value={child.parentRelationship || "Not set"} />
      </div>

      <InfoCard label="Complete Home Address" value={child.homeAddress || "Not set"} />

      {child.daycareCenter ? <InfoCard label="Daycare Center" value={child.daycareCenter.name} /> : null}
    </div>
  );
}

export function HealthSection({ child, tabId }: { child: Child; tabId: string }) {
  return (
    <div id="health-panel" role="tabpanel" aria-labelledby={tabId} className="space-y-4 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-300">
      <div className="rounded-3xl border border-gray-200/70 bg-white/80 p-5 shadow-sm dark:border-slate-700/60 dark:bg-slate-900/70">
        <div className="flex items-center gap-2">
          <HeartPulse size={18} className="text-teal-600 dark:text-teal-400" />
          <p className="text-base font-bold tracking-[-0.01em] text-gray-900 dark:text-slate-100">Health metrics</p>
        </div>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <InfoCard label="Weight" value={formatMetric(child.weight, "kg")} />
          <InfoCard label="Height" value={formatMetric(child.height, "cm")} />
          <InfoCard label="BMI" value={formatMetric(child.bmi)} />
        </div>
        <div className="mt-4">
          <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${getNutritionalStatusColor(child.nutritionalStatus)}`}>
            {child.nutritionalStatus || "Nutrition status not set"}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ContactCard
          label="Parent"
          name={child.parent ? formatFullName(child.parent.firstName, child.parent.middleName, child.parent.lastName) : "Not linked"}
          email={child.parent?.email}
          phone={child.parent?.phone}
          emptyLabel="Not linked"
        />
        <ContactCard
          label="Teacher"
          name={child.teacher ? formatFullName(child.teacher.firstName, child.teacher.middleName, child.teacher.lastName) : "Unassigned"}
          email={child.teacher?.email}
          emptyLabel="Unassigned"
        />
      </div>
    </div>
  );
}

export function DocumentsSection({
  child,
  tabId,
  documentLoading,
  blockchainProof,
  blockchainProofLoading,
  viewError,
  blockchainProofError,
  onOpenDocument,
}: {
  child: Child;
  tabId: string;
  documentLoading: ChildDocumentType | null;
  blockchainProof: ChildBlockchainProof | null;
  blockchainProofLoading: boolean;
  viewError: string | null;
  blockchainProofError: string | null;
  onOpenDocument: (documentType: ChildDocumentType) => Promise<void>;
}) {
  const documentErrorMessage = viewError
    ? "This document could not be opened because the file was not found. It may have been removed or the record may need to be uploaded again."
    : null;
  const blockchainErrorMessage = blockchainProofError
    ? "Blockchain verification details are not available for this child yet."
    : null;

  return (
    <div id="documents-panel" role="tabpanel" aria-labelledby={tabId} className="space-y-4 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-300">
      <div className="rounded-3xl border border-gray-200/70 bg-white/80 p-5 shadow-sm dark:border-slate-700/60 dark:bg-slate-900/70">
        <p className="text-base font-bold tracking-[-0.01em] text-gray-900 dark:text-slate-100">Protected documents</p>
        <p className="mt-1 text-sm font-medium text-gray-500 dark:text-slate-400">Secure links are signed for a short time window before opening.</p>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <DocumentCard
            label="Birth Certificate"
            description="Identity document for enrollment and verification."
            isAvailable={Boolean(child.documents?.birthCertificate?.publicId)}
            isLoading={documentLoading === "birth-certificate"}
            onOpen={() => onOpenDocument("birth-certificate")}
            verification={blockchainProof ? blockchainProof.documents.birthCertificate.blockchainVerified : undefined}
          />
          <DocumentCard
            label="Parent ID"
            description="Guardian identification for records and access review."
            isAvailable={Boolean(child.documents?.parentId?.publicId)}
            isLoading={documentLoading === "parent-id"}
            onOpen={() => onOpenDocument("parent-id")}
            verification={blockchainProof ? blockchainProof.documents.parentId.blockchainVerified : undefined}
          />
        </div>
      </div>

      {documentErrorMessage ? <ErrorAlert tone="danger" title="Document unavailable" message={documentErrorMessage} /> : null}
      {blockchainErrorMessage ? <ErrorAlert tone="warning" title="Verification unavailable" message={blockchainErrorMessage} /> : null}

      {blockchainProofLoading || blockchainProof ? (
        <div className="rounded-3xl border border-cyan-300/60 bg-cyan-50/80 p-5 shadow-sm dark:border-cyan-500/30 dark:bg-cyan-900/10">
          {blockchainProofLoading ? (
            <div className="inline-flex items-center gap-2 text-sm font-semibold text-cyan-900 dark:text-cyan-100">
              <Loader2 size={16} className="animate-spin motion-reduce:animate-none" />
              Verifying on blockchain...
            </div>
          ) : blockchainProof ? (
            <div className="space-y-4">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-cyan-700 dark:text-cyan-300">Blockchain identity</p>
                <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <InfoCard label="Network" value={blockchainProof.network || "N/A"} />
                  <InfoCard
                    label="Transaction"
                    value={<span className="font-mono text-xs">{blockchainProof.txHash ? formatTxDisplay(blockchainProof.txHash) : "N/A"}</span>}
                    subvalue={blockchainProof.anchoredAt ? `Anchored ${formatDate(blockchainProof.anchoredAt)}` : undefined}
                  />
                </div>
              </div>

              {blockchainProof.etherscanUrl ? (
                <a
                  href={blockchainProof.etherscanUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-cyan-700 underline decoration-cyan-500/60 underline-offset-2 hover:text-cyan-800 dark:text-cyan-300 dark:hover:text-cyan-200"
                >
                  View on Etherscan
                  <ExternalLink size={14} />
                </a>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
