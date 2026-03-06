import { Router } from "express";
import {
  recordAttendance,
  verifyAttendance,
  fetchRecordMeta,
} from "../controllers/blockchain/blockchain.controller";
import {
  anchorDailyBatchController,
  getChildProofController,
  verifyAnchorController,
  listAnchorsController,
  getAnchorStatusController,
} from "../controllers/blockchain/dailyBatchAnchoring.controller";

const router = Router();

// Old endpoints
router.post("/record", recordAttendance);
router.post("/verify", verifyAttendance);
router.get("/meta/:childId/:date", fetchRecordMeta);

// New Merkle tree + daily batch endpoints
router.post("/anchor-daily", anchorDailyBatchController);
router.get("/proof/:childId", getChildProofController);
router.get("/verify-anchor", verifyAnchorController);
router.get("/anchors", listAnchorsController);
router.get("/anchor-status/:dateHash", getAnchorStatusController);

export default router;
