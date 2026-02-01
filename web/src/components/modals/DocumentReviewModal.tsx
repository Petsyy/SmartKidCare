import { X, CheckCircle, AlertCircle } from "lucide-react";
import { useState } from "react";
import { type User } from "../../api/api";

type DocumentReviewModalProps = {
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
  onApprove: () => void;
  onReject: () => void;
  isLoading?: boolean;
};

export default function DocumentReviewModal({
  user,
  isOpen,
  onClose,
  onApprove,
  onReject,
  isLoading = false,
}: DocumentReviewModalProps) {
  const [previewDoc, setPreviewDoc] = useState<string | null>(null);

  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      {/* Preview Modal */}
      {previewDoc && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4" onClick={() => setPreviewDoc(null)}>
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-auto relative" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setPreviewDoc(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 bg-white rounded-full p-1"
            >
              <X size={24} />
            </button>
            <div className="p-6 flex items-center justify-center min-h-100">
              {previewDoc.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                <img src={previewDoc} alt="Document preview" className="max-w-full max-h-[80vh] object-contain" />
              ) : (
                <div className="text-center text-gray-500">
                  <p className="text-lg font-medium mb-2">File: {previewDoc.split('/').pop()}</p>
                  <p className="text-sm">Preview not available for this file type</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Review Documents</h2>
            <p className="text-sm text-gray-600 mt-1">{user.name}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* User Info */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-600 uppercase tracking-wider">Name</p>
                <p className="font-semibold text-gray-900">{user.name}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600 uppercase tracking-wider">Email</p>
                <p className="font-semibold text-gray-900">{user.email}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600 uppercase tracking-wider">Phone</p>
                <p className="font-semibold text-gray-900">{user.phone || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600 uppercase tracking-wider">Status</p>
                <p className={`font-semibold capitalize ${user.verificationStatus === 'pending' ? 'text-yellow-600' :
                    user.verificationStatus === 'approved' ? 'text-green-600' :
                      'text-red-600'
                  }`}>
                  {user.verificationStatus}
                </p>
              </div>
            </div>
          </div>

          {/* Documents Section */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Submitted Documents</h3>

            {user.documents.length === 0 ? (
              <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-3">
                <AlertCircle className="text-yellow-600 shrink-0 mt-0.5" size={20} />
                <div>
                  <p className="font-semibold text-yellow-900">No Documents Uploaded</p>
                  <p className="text-sm text-yellow-800 mt-1">
                    This {user.role} has not submitted any documents yet. Please contact them to upload required documents.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {user.documents.map((doc, index) => (
                  <div
                    key={index}
                    onClick={() => setPreviewDoc(doc)}
                    className="p-4 border border-gray-200 rounded-lg flex items-center justify-between hover:bg-blue-50 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <span className="text-xs font-bold text-blue-600">
                          {doc.split('.').pop()?.toUpperCase() || 'DOC'}
                        </span>
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{doc}</p>
                        <p className="text-xs text-gray-500 mt-0.5">Click to view</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Review Notes */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-3">
              <CheckCircle className="text-blue-600 shrink-0 mt-0.5" size={20} />
              <div>
                <p className="font-semibold text-blue-900">Review Checklist</p>
                <ul className="text-sm text-blue-800 mt-2 space-y-1 ml-5 list-disc">
                  <li>Verify all documents are valid and not expired</li>
                  <li>Check that documents match the applicant's information</li>
                  <li>Ensure documents meet organizational requirements</li>
                  <li>Confirm no fraudulent or falsified documents</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-end gap-3">
          {user.verificationStatus === "pending" && (
            <>
              <button
                onClick={onReject}
                disabled={isLoading}
                className="px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 font-medium"
              >
                {isLoading ? "Processing..." : "Reject"}
              </button>
              <button
                onClick={onApprove}
                disabled={isLoading}
                className="px-4 py-2 text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 font-medium"
              >
                {isLoading ? "Processing..." : "Approve"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
