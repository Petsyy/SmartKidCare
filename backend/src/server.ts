import dotenv from "dotenv";
dotenv.config();

import app from "./app";
import { connectDB } from "./config/db";
import { startTeacherNotificationScheduler } from "./services/notifications-services/teacherNotificationScheduler.service";

const PORT = process.env.PORT || 5000;

connectDB();

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  startTeacherNotificationScheduler();
});
