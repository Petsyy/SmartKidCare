import { asyncHandler } from "../../../shared/utils/async-handler";
import { offlineSyncService } from "../services/offline-sync.service";

export const createSnapshot = asyncHandler(async (req, res) => {
  const data = await offlineSyncService.createSnapshot(req.user);
  res.status(201).json({ data });
});

export const getSnapshotPage = asyncHandler(async (req, res) => {
  const data = await offlineSyncService.getPage(
    req.user,
    String(req.params.snapshotId),
    String(req.params.resource),
    Number(req.query.cursor ?? 0),
  );
  res.json({ data });
});

export const deleteSnapshot = asyncHandler(async (req, res) => {
  await offlineSyncService.deleteSnapshot(
    req.user,
    String(req.params.snapshotId),
  );
  res.status(204).send();
});
