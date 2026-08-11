import mongoose from "mongoose";
import dotenv from "dotenv";
import Child from "../src/models/Child";
import NutritionRecord from "../src/models/NutritionRecord";
import User from "../src/models/Users";
import {
  calculateBmi,
  classifyNutritionalStatus,
} from "../src/shared/utils/nutrition.utils";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI as string;

if (!MONGO_URI) {
  console.error("❌ MONGO_URI not found in environment variables");
  process.exit(1);
}

const migrateNutrition = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ Connected to MongoDB");

    const children = await Child.find({
      weight: { $ne: null },
      height: { $ne: null },
    });
    console.log(`Found ${children.length} children with weight/height data.`);

    // We need an admin user to set as recordedBy if teacher is missing.
    const adminUser = await User.findOne({ role: "admin" });
    if (!adminUser) {
      console.warn(
        "⚠ No admin user found. Migrated records might lack a recordedBy user if child has no teacher."
      );
    }
    const fallbackUserId = adminUser?._id;

    let migratedCount = 0;
    let skippedCount = 0;

    for (const child of children) {
      const childObj = child.toObject() as any;

      const existingRecord = await NutritionRecord.findOne({
        childId: child._id,
        schoolYear: child.schoolYear,
        period: "initial",
      });

      if (existingRecord) {
        skippedCount++;
        continue;
      }

      const bmi =
        childObj.bmi ?? calculateBmi(childObj.weight, childObj.height);
      const nutritionalStatus =
        childObj.nutritionalStatus ??
        classifyNutritionalStatus(bmi, childObj.age);

      await NutritionRecord.create({
        childId: child._id,
        schoolYear: child.schoolYear,
        period: "initial",
        recordedBy: childObj.teacher || fallbackUserId,
        status: "submitted",
        weight: childObj.weight,
        height: childObj.height,
        bmi,
        nutritionalStatus,
        measurementDate: childObj.enrollmentDate || childObj.createdAt || new Date(),
        submittedAt: childObj.createdAt || new Date(),
      });

      migratedCount++;
    }

    console.log(`🎉 Migration complete.`);
    console.log(`✅ Migrated: ${migratedCount}`);
    console.log(`⏭ Skipped (already exists): ${skippedCount}`);
    console.log(`⚠ Remember to manually run this script with ts-node before removing the legacy fields.`);
  } catch (error: any) {
    console.error("❌ Failed to migrate nutrition records:", error.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

migrateNutrition();
