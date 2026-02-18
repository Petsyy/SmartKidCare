import dotenv from "dotenv";
dotenv.config();

import app from "./app";
import { connectDB } from "./config/db";
import { verifyMailer } from "./lib/mailer";

const PORT = process.env.PORT || 5000;

connectDB();
void verifyMailer();

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
