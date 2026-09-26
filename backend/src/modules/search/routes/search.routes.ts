import { Router } from "express";
import { globalSearch } from "../controllers/search.controller";
import { authenticateToken } from "../../../shared/middleware/auth.middleware";

const router = Router();

router.use(authenticateToken);
router.get("/", globalSearch);

export default router;
