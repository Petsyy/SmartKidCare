import { Router } from "express";
import {
  recordAttendance,
  verifyAttendance,
  fetchRecordMeta,
} from "../controllers/blockchain/blockchain.controller";

const router = Router();

router.post("/record", recordAttendance);
router.post("/verify", verifyAttendance);
router.get("/meta/:childId/:date", fetchRecordMeta);

export default router;
