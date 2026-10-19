import bcrypt from "bcryptjs";
import mongoose from "mongoose";

import ChildDevelopmentCenter from "../src/models/ChildDevelopmentCenter";
import User from "../src/models/Users";

const E2E_USERNAME = "e2e.captain";
const E2E_EMAIL = "e2e.captain@smartkidcare.test";
const E2E_PASSWORD = "E2eCaptain123!";
const E2E_CENTER_CODE = "E2E-CENTER";

const seed = async () => {
  const mongoUri = String(
    process.env.MONGO_URI || "mongodb://127.0.0.1:27017/smartkidcare_e2e",
  ).trim();

  if (!/smartkidcare_e2e(?:\?|$)/i.test(mongoUri)) {
    throw new Error(
      "Refusing to seed E2E data outside a database named smartkidcare_e2e.",
    );
  }

  await mongoose.connect(mongoUri);

  await User.deleteMany({
    $or: [{ username: E2E_USERNAME }, { email: E2E_EMAIL }],
  });
  await ChildDevelopmentCenter.deleteMany({ code: E2E_CENTER_CODE });

  const center = await ChildDevelopmentCenter.create({
    name: "SmartKidCare E2E Center",
    barangay: "E2E Barangay",
    code: E2E_CENTER_CODE,
    address: "Automated test environment",
    isActive: true,
  });

  await User.create({
    username: E2E_USERNAME,
    daycareCenter: center._id,
    firstName: "E2E",
    lastName: "Captain",
    email: E2E_EMAIL,
    phone: "09000000000",
    password: await bcrypt.hash(E2E_PASSWORD, 10),
    role: "barangay_captain",
    isActive: true,
    mustChangePassword: false,
    needsToConfirmLink: false,
    adminMfaEnabled: false,
  });

  console.log(`Seeded E2E account ${E2E_USERNAME}.`);
};

seed()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
