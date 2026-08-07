import express from "express";
import { viewDocument } from "../controllers/documents.controller";

const router = express.Router();

router.get("/view", viewDocument);

export default router;
