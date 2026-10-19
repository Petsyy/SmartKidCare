import bcrypt from "bcryptjs";
import mongoose from "mongoose";

import ChildDevelopmentCenter from "../src/models/ChildDevelopmentCenter";
import Child from "../src/models/Child";
import User from "../src/models/Users";

const E2E_USERNAME = String(process.env.E2E_CAPTAIN_USERNAME || "").trim();
const E2E_PASSWORD = String(process.env.E2E_CAPTAIN_PASSWORD || "");
const E2E_EMAIL = `${E2E_USERNAME}@smartkidcare.test`;
const E2E_CENTER_CODE = "E2E-CENTER";
const E2E_CHILD_FIRST_NAME = "E2E";
const E2E_CHILD_LAST_NAME = "ReadOnly";

const seed = async () => {
  const mongoUri = String(
    process.env.MONGO_URI || "mongodb://127.0.0.1:27017/smartkidcare_e2e",
  ).trim();

  if (!/smartkidcare_e2e(?:\?|$)/i.test(mongoUri)) {
    throw new Error(
      "Refusing to seed E2E data outside a database named smartkidcare_e2e.",
    );
  }

  if (!E2E_USERNAME || !E2E_PASSWORD) {
    throw new Error(
      "E2E_CAPTAIN_USERNAME and E2E_CAPTAIN_PASSWORD must be provided.",
    );
  }

  await mongoose.connect(mongoUri);

  await User.deleteMany({
    $or: [{ username: E2E_USERNAME }, { email: E2E_EMAIL }],
  });
  await Child.deleteMany({
    firstName: E2E_CHILD_FIRST_NAME,
    lastName: E2E_CHILD_LAST_NAME,
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

  await Child.create({
    firstName: E2E_CHILD_FIRST_NAME,
    lastName: E2E_CHILD_LAST_NAME,
    dateOfBirth: new Date("2021-06-15T00:00:00.000Z"),
    age: 5,
    gender: "female",
    homeAddress: "Automated test environment",
    parentRelationship: "Mother",
    programType: "Regular Enrollee (Non-beneficiary)",
    enrollmentDate: new Date("2026-06-01T00:00:00.000Z"),
    schoolYear: "2026-2027",
    status: "Active",
    daycareCenter: center._id,
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
