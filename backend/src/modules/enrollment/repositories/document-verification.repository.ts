import DocumentVerification from "../../../models/DocumentVerification";

export const documentVerificationRepository = {
  findReusable(query: Record<string, unknown>) {
    return DocumentVerification.findOne({
      ...query,
      status: { $in: ["verified", "teacher_confirmation_required", "rejected"] },
      isTransientFailure: false,
      consumedAt: null,
      expiresAt: { $gt: new Date() },
    }).sort({ createdAt: -1 }).lean();
  },
  findActive(query: Record<string, unknown>) {
    return DocumentVerification.findOne({
      ...query,
      status: { $in: ["queued", "processing", "retrying"] },
      consumedAt: null,
      expiresAt: { $gt: new Date() },
    }).sort({ createdAt: -1 }).lean();
  },
  create(payload: Record<string, unknown>) { return DocumentVerification.create(payload); },
  findOwned(id: string, teacherId: string) { return DocumentVerification.findOne({ _id: id, teacherId }); },
  findOwnedForProcessing(id: string, teacherId?: string) {
    return DocumentVerification.findOne({
      _id: id,
      ...(teacherId ? { teacherId } : {}),
    }).select("+imageData +expectedFields");
  },
  claimForProcessing(id: string) {
    const staleBefore = new Date(Date.now() - 2 * 60_000);
    return DocumentVerification.findOneAndUpdate(
      {
        _id: id,
        consumedAt: null,
        expiresAt: { $gt: new Date() },
        $or: [
          { status: { $in: ["queued", "retrying"] }, nextAttemptAt: { $lte: new Date() } },
          { status: "queued", nextAttemptAt: null },
          { status: "processing", processingStartedAt: { $lt: staleBefore } },
        ],
      },
      {
        $set: { status: "processing", processingStartedAt: new Date() },
        $inc: { attemptCount: 1 },
      },
      { new: true },
    ).select("+imageData +expectedFields");
  },
  completeProcessing(id: string, values: Record<string, unknown>) {
    return DocumentVerification.findByIdAndUpdate(
      id,
      {
        $set: {
          ...values,
          completedAt: new Date(),
          processingStartedAt: null,
          nextAttemptAt: null,
          imageData: null,
          expectedFields: null,
        },
      },
      { new: true },
    );
  },
  deferProcessing(id: string, values: Record<string, unknown>) {
    return DocumentVerification.findByIdAndUpdate(id, { $set: values }, { new: true });
  },
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
