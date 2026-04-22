import express from "express";
import { viewDocument } from "./documents.controller";

const router = express.Router();

router.get("/view", viewDocument);

export default router;

