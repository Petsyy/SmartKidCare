import mongoose from "mongoose";
import dotenv from "dotenv";
import ChildDevelopmentCenter from "../src/models/ChildDevelopmentCenter";
import { connectDB } from "../src/shared/config/db";

dotenv.config();

const DAGUPAN_BARANGAYS = [
  "Bacayao Norte",
  "Bacayao Sur",
  "Barangay I",
  "Barangay II & III",
  "Barangay IV",
  "Bolosan",
  "Bonuan Binloc",
  "Bonuan Boquig",
  "Bonuan Gueset",
  "Calmay",
  "Carael",
  "Caranglaan",
  "Herrero-Perez",
  "Lasip Chico",
  "Lasip Grande",
  "Lomboy",
  "Lucao",
  "Malued",
  "Mamalingling",
  "Manguin",
  "Mayombo",
  "Pantal",
  "Poblacion Oeste",
  "Pogo Chico",
  "Pogo Grande",
  "Pugaro Suit",
  "Salapingao",
  "Salisay",
  "Tambac",
  "Tapuac",
  "Tebeng",
];

const toCode = (barangay: string) =>
  barangay
    .toUpperCase()
    .replace(/&/g, "AND")
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

const seed = async () => {
  await connectDB();

  for (const barangay of DAGUPAN_BARANGAYS) {
    const code = toCode(barangay);
    const name = `${barangay} Child Development Center`;

    await ChildDevelopmentCenter.updateOne(
      { code },
      {
        $set: {
          name,
          barangay,
          code,
          isActive: true,
        },
      },
      { upsert: true },
    );
  }

  const total = await ChildDevelopmentCenter.countDocuments();
  console.log(`Seeded Dagupan child development centers. Total centers: ${total}`);
};

seed()
  .catch((error) => {
    console.error("Failed to seed Dagupan centers:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
