import * as Crypto from "expo-crypto";
import {
  createOfflineSnapshot,
  deleteOfflineSnapshot,
  getOfflineSnapshotPage,
  type OfflineResource,
} from "@/src/api/offline-sync.api";
import {
  activateRecordSnapshot,
  beginRecordSnapshot,
  failRecordSnapshot,
  writeRecordSnapshotPage,
} from "./offline-record-store";

export type RecordSyncProgress = {
  snapshotId?: string;
  currentResource?: OfflineResource;
  downloadedItems: number;
  expectedItems: number;
};

export const synchronizeOfflineRecords = async (
  userId: string,
  onProgress?: (progress: RecordSyncProgress) => void,
) => {
  let snapshotId: string | null = null;
  await beginRecordSnapshot(userId);
  try {
    const manifest = await createOfflineSnapshot();
    snapshotId = manifest.snapshotId;
    if (Date.parse(manifest.expiresAt) <= Date.now())
      throw new Error("OFFLINE_SNAPSHOT_EXPIRED");
    const expectedItems = manifest.resources.reduce(
      (sum, item) => sum + item.itemCount,
      0,
    );
    let downloadedItems = 0;
    for (const resourceManifest of manifest.resources) {
      const allItems: Record<string, unknown>[] = [];
      let cursor: string | null = "0";
      do {
        const page = await getOfflineSnapshotPage(
          manifest.snapshotId,
          resourceManifest.resource,
          cursor,
        );
        if (
          page.snapshotId !== manifest.snapshotId ||
          page.resource !== resourceManifest.resource
        )
          throw new Error("OFFLINE_SNAPSHOT_MISMATCH");
        await writeRecordSnapshotPage(
          userId,
          manifest.snapshotId,
          resourceManifest.resource,
          page.items,
        );
        allItems.push(...page.items);
        downloadedItems += page.items.length;
        onProgress?.({
          snapshotId: manifest.snapshotId,
          currentResource: resourceManifest.resource,
          downloadedItems,
          expectedItems,
        });
        cursor = page.nextCursor;
        if (!cursor && !page.complete)
          throw new Error("OFFLINE_SNAPSHOT_INCOMPLETE");
      } while (cursor);
      if (allItems.length !== resourceManifest.itemCount)
        throw new Error("OFFLINE_SNAPSHOT_COUNT_MISMATCH");
      const actualChecksum = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        JSON.stringify(allItems),
      );
      if (actualChecksum !== resourceManifest.checksum)
        throw new Error("OFFLINE_SNAPSHOT_CHECKSUM_MISMATCH");
    }
    await activateRecordSnapshot(userId, manifest.snapshotId);
    await deleteOfflineSnapshot(manifest.snapshotId).catch(() => undefined);
    return manifest.snapshotId;
  } catch (error) {
    const code =
      error instanceof Error ? error.message : "OFFLINE_SNAPSHOT_FAILED";
    await failRecordSnapshot(userId, snapshotId, code);
    if (snapshotId)
      await deleteOfflineSnapshot(snapshotId).catch(() => undefined);
    throw error;
  }
};
