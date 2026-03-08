import express from "express";
import {
  createChild,
  deleteChild,
  getChildren,
  getChildById,
  getChildBlockchainProof,
  getChildDocumentSignedUrl,
  getChildDocumentUrl,
  streamChildDocument,
  getMyChildren,
  updateChild,
} from "../controllers/child/child.controller";
import { authenticateToken } from "../middlewares/auth.middleware";
import upload from "../middlewares/uploadDocuments";

const router = express.Router();

router.get("/", authenticateToken, getChildren);
router.get("/my-children", authenticateToken, getMyChildren);
router.get("/:id/blockchain-proof", authenticateToken, getChildBlockchainProof);
router.get("/:id/documents/:documentType/url", authenticateToken, getChildDocumentSignedUrl);
router.get("/document-access/:token", getChildDocumentUrl);
router.get("/document-stream/:token", streamChildDocument);
router.get("/:id", authenticateToken, getChildById);
router.patch("/:id", authenticateToken, updateChild);
router.delete("/:id", authenticateToken, deleteChild);

router.post(
  "/",
  authenticateToken,
  upload.fields([
    { name: "birthCertificate", maxCount: 1 },
    { name: "parentId", maxCount: 1 },
  ]),
  createChild,
);

export default router;
