import { Router } from "express";
import { login, adminLogin, getMe, getAllUsers, updateUserStatus } from "../controllers/auth.controller";
import { authenticateToken } from "../middlewares/auth.middleware";

const router = Router();

router.post("/login", login);
router.post("/admin/login", adminLogin);

router.get("/me", authenticateToken, getMe);

router.get("/users", getAllUsers);
router.patch("/users/:userId/status", updateUserStatus);

export default router;
