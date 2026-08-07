import { createPortal } from "react-dom";
import { UserRound, X } from "lucide-react";
import { DocumentsSection, HealthSection, ProfileSection } from "./child-details-modal/sections";
import { type ChildDetailsModalProps, type ChildDetailsTab } from "./child-details-modal/types";
import { useChildDetailsModal } from "./child-details-modal/useChildDetailsModal";
import { formatFullName } from "./child-details-modal/utils";

const tabs: { key: ChildDetailsTab; label: string }[] = [
  { key: "profile", label: "Profile" },
  { key: "health", label: "Health & Contacts" },
  { key: "documents", label: "Documents" },
];

export default function ChildDetailsModal({
  child,
  viewError,
  documentLoading,
  blockchainProof,
  blockchainProofLoading,
  blockchainProofError,
  onClose,
  onOpenDocument,
}: ChildDetailsModalProps) {
  const {
    activeTab,
    setActiveTab,
    modalRef,
    titleId,
    descriptionId,
    profileTabId,
    healthTabId,
    documentsTabId,
  } = useChildDetailsModal(child, onClose);

  if (!child) return null;

  const fullName = formatFullName(child.firstName, child.middleName, child.lastName);
  const tabIds: Record<ChildDetailsTab, string> = {
    profile: profileTabId,
    health: healthTabId,
    documents: documentsTabId,
  };

  const handleTabKeyDown = (
    event: React.KeyboardEvent<HTMLButtonElement>,
    index: number,
  ) => {
    if (!["ArrowRight", "ArrowLeft", "Home", "End"].includes(event.key)) {
      return;
    }

    event.preventDefault();

    let nextIndex = index;
    if (event.key === "ArrowRight") nextIndex = (index + 1) % tabs.length;
    if (event.key === "ArrowLeft") nextIndex = (index - 1 + tabs.length) % tabs.length;
    if (event.key === "Home") nextIndex = 0;
    if (event.key === "End") nextIndex = tabs.length - 1;

    const nextTab = tabs[nextIndex];
    setActiveTab(nextTab.key);
    document.getElementById(tabIds[nextTab.key])?.focus();
  };

  return createPortal(
    <div
      className="fixed inset-0 z-60 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        tabIndex={-1}
        className="flex max-h-[95dvh] w-full max-w-4xl flex-col overflow-hidden rounded-t-4xl bg-white shadow-xl outline-none dark:bg-slate-900 sm:rounded-4xl"
      >
        <div className="sticky top-0 z-20 border-b border-teal-200 bg-teal-50 px-5 py-4 dark:border-teal-900/50 dark:bg-teal-900/20 sm:px-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-center gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-teal-100 text-teal-600 dark:bg-teal-900/40 dark:text-teal-400">
                <UserRound size={20} />
              </div>
              <div className="min-w-0">
                <h2 id={titleId} className="truncate text-[1.9rem] font-black tracking-[-0.03em] text-gray-900 dark:text-slate-100">
                  {fullName || "Child details"}
                </h2>
                <p id={descriptionId} className="mt-1 text-[15px] font-medium text-gray-600 dark:text-slate-300">
                  {child.studentId ? `Student ID ${child.studentId}` : "Student ID not assigned"}{" "}
                  <span className="text-gray-400 dark:text-slate-500">|</span>{" "}
                  {child.age || "Age not set"} years old
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close child details"
              className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 motion-reduce:transition-none dark:text-slate-500 dark:hover:bg-slate-700 dark:hover:text-slate-300"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="sticky top-22 z-10 border-b border-gray-200 bg-white dark:border-slate-700 dark:bg-slate-900">
          <div className="flex overflow-x-auto px-3 sm:px-4" role="tablist" aria-label="Child detail sections">
            {tabs.map((tab, index) => (
              <button
                key={tab.key}
                id={tabIds[tab.key]}
                type="button"
                role="tab"
                aria-selected={activeTab === tab.key}
                aria-controls={`${tab.key}-panel`}
                tabIndex={activeTab === tab.key ? 0 : -1}
                onClick={() => setActiveTab(tab.key)}
                onKeyDown={(event) => handleTabKeyDown(event, index)}
                className={`shrink-0 border-b-2 px-4 py-3 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-inset motion-reduce:transition-none ${
                  activeTab === tab.key
                    ? "border-teal-500 text-teal-700 dark:border-teal-400 dark:text-teal-300"
                    : "border-transparent text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-200"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto bg-white px-4 py-4 dark:bg-slate-900 sm:px-6 sm:py-5">
          {activeTab === "profile" ? <ProfileSection child={child} tabId={profileTabId} /> : null}
          {activeTab === "health" ? <HealthSection child={child} tabId={healthTabId} /> : null}
          {activeTab === "documents" ? (
            <DocumentsSection
              child={child}
              tabId={documentsTabId}
              documentLoading={documentLoading}
              blockchainProof={blockchainProof}
              blockchainProofLoading={blockchainProofLoading}
              viewError={viewError}
              blockchainProofError={blockchainProofError}
              onOpenDocument={onOpenDocument}
            />
          ) : null}
        </div>
      </div>
    </div>,
    document.body,
  );
}
