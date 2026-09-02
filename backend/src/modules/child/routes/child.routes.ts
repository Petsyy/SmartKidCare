import express from "express";
import {getChildren,getMyChildren,getChildById,createChild,deleteChild,
  updateChild,
} from "../controllers";
import {validateCreateChild,validateUpdateChild,validateGetChildrenQuery,} from "../validators/child.validator";

import { authenticateToken } from "../../../shared/middleware/auth.middleware";
import upload from "../../../shared/middleware/upload.middleware";

const router = express.Router();

router.use(authenticateToken);

router.get("/", validateGetChildrenQuery, getChildren);
router.get("/my-children", getMyChildren);

router.get("/:id", getChildById);

router.post("/", upload.fields([{ name: "birthCertificate", maxCount: 1 },{ name: "parentId", maxCount: 1 },]), validateCreateChild,createChild);

router.patch("/:id", validateUpdateChild, updateChild);
router.delete("/:id", deleteChild);

export default router;
