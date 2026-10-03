import DocumentVerification from "../../../models/DocumentVerification";

export const documentVerificationRepository = {
  findReusable(query: Record<string, unknown>) {
    return DocumentVerification.findOne({ ...query, isTransientFailure: false, consumedAt: null, expiresAt: { $gt: new Date() } }).sort({ createdAt: -1 }).lean();
  },
  create(payload: Record<string, unknown>) { return DocumentVerification.create(payload); },
  findOwned(id: string, teacherId: string) { return DocumentVerification.findOne({ _id: id, teacherId }); },
  findEligible(id: string, teacherId: string) { return DocumentVerification.findOne({ _id: id, teacherId, consumedAt: null, expiresAt: { $gt: new Date() } }); },
  consume(id: string, teacherId: string, childId: string) {
    return DocumentVerification.findOneAndUpdate(
      { _id: id, teacherId, consumedAt: null, expiresAt: { $gt: new Date() } },
      { $set: { consumedAt: new Date(), consumedByEnrollmentId: childId } },
      { new: true },
    );
  },
  release(id: string, teacherId: string, childId: string) {
    return DocumentVerification.updateOne(
      { _id: id, teacherId, consumedByEnrollmentId: childId },
      { $set: { consumedAt: null, consumedByEnrollmentId: null } },
    );
  },
};
