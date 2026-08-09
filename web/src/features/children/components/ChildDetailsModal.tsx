import { X, UserRound } from "lucide-react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/Dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import {
  DocumentsSection,
  HealthSection,
  ProfileSection,
} from "./child-details-modal/sections";
import {
  type ChildDetailsModalProps,
  type ChildDetailsTab,
} from "./child-details-modal/types";
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
  const { titleId, descriptionId, profileTabId, healthTabId, documentsTabId } =
    useChildDetailsModal();

  if (!child) return null;

  const fullName = formatFullName(
    child.firstName,
    child.middleName,
    child.lastName,
  );
  const tabIds: Record<ChildDetailsTab, string> = {
    profile: profileTabId,
    health: healthTabId,
    documents: documentsTabId,
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        overlayClassName="bg-transparent"
        className="fixed inset-0 z-60 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm outline-none transition-all"
        onClick={onClose}
      >
        <div
          className="flex max-h-[90dvh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl border border-white/20 bg-white/95 shadow-2xl backdrop-blur-xl dark:border-slate-700/50 dark:bg-slate-900/95"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="flex items-center justify-between border-b border-gray-200/50 bg-gradient-to-r from-teal-50 to-emerald-50/50 px-6 py-5 backdrop-blur-md dark:border-slate-700/50 dark:from-teal-900/30 dark:to-emerald-900/20">
            <div className="flex min-w-0 items-center gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-100 text-teal-600 dark:bg-teal-900/40 dark:text-teal-400">
                <UserRound size={20} />
              </div>
              <div className="min-w-0">
                <DialogTitle asChild>
                  <h2
                    id={titleId}
                    className="truncate text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100"
                  >
                    {fullName || "Child details"}
                  </h2>
                </DialogTitle>
                <DialogDescription asChild>
                  <p
                    id={descriptionId}
                    className="mt-1 text-sm font-normal text-slate-600 dark:text-slate-400"
                  >
                    {child.studentId
                      ? `Student ID ${child.studentId}`
                      : "Student ID not assigned"}{" "}
                    <span className="mx-1.5 text-gray-400 dark:text-slate-500">
                      |
                    </span>{" "}
                    {child.age || "Age not set"} years old
                  </p>
                </DialogDescription>
              </div>
            </div>
            <DialogClose asChild>
              <button
                type="button"
                aria-label="Close child details"
                className="cursor-pointer shrink-0 rounded-xl bg-white/50 p-2 text-gray-500 shadow-sm backdrop-blur-sm transition-all duration-200 hover:bg-white hover:text-gray-700 dark:bg-slate-800/50 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-200"
              >
                <X size={18} />
              </button>
            </DialogClose>
          </div>

          <Tabs
            key={child._id}
            defaultValue="profile"
            className="flex min-h-0 flex-1 flex-col"
          >
            <div className="sticky top-22 z-10 border-b border-gray-200 bg-white dark:border-slate-700 dark:bg-slate-900">
              <TabsList
                className="flex overflow-x-auto px-3 sm:px-4"
                aria-label="Child detail sections"
              >
                {tabs.map((tab) => (
                  <TabsTrigger
                    key={tab.key}
                    id={tabIds[tab.key]}
                    value={tab.key}
                    className="shrink-0 border-b-2 border-transparent px-4 py-3 text-sm font-medium text-gray-500 transition hover:text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-inset data-[state=active]:border-teal-500 data-[state=active]:text-teal-700 motion-reduce:transition-none dark:text-slate-400 dark:hover:text-slate-200 dark:data-[state=active]:border-teal-400 dark:data-[state=active]:text-teal-300"
                  >
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            <div className="flex-1 overflow-y-auto bg-white px-4 py-4 dark:bg-slate-900 sm:px-6 sm:py-5">
              <TabsContent value="profile" asChild>
                <ProfileSection child={child} tabId={profileTabId} />
              </TabsContent>
              <TabsContent value="health" asChild>
                <HealthSection child={child} tabId={healthTabId} />
              </TabsContent>
              <TabsContent value="documents" asChild>
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
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
