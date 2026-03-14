import dotenv from "dotenv";
import dns from "dns";
dns.setDefaultResultOrder("ipv4first");
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
