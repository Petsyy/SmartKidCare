import express from "express";
import * as nutritionController from "../controllers/nutrition.controller";
import * as validator from "../validators/nutrition.validator";
import { authenticateToken } from "../../../shared/middleware/auth.middleware";
import { requireRole } from "../../../shared/middleware/role.middleware";

const router = express.Router();

router.use(authenticateToken);


router.get("/my-class", requireRole("teacher"), validator.validateGetMyClass, nutritionController.getMyClassNutrition);

router.post("/evaluate", requireRole("teacher"), validator.validateEvaluateNutrition, nutritionController.evaluateNutrition);

router.get("/child/:id", requireRole("admin", "teacher", "parent"), validator.validateChildNutritionParams, nutritionController.getChildNutritionHistory);

router.get("/analytics", requireRole("admin"), validator.validateNutritionAnalytics, nutritionController.getNutritionAnalytics);

export default router;
