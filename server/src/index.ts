import "dotenv/config";
import express from "express";
import cors from "cors";
import { connectDB } from "./config/db";
import authRoutes from "./routes/auth";
import taskRoutes from "./routes/tasks";
import aiRoutes from "./routes/ai";
import { errorHandler, notFound } from "./middleware/error";

const { PORT = "5000", MONGO_URI, JWT_SECRET, CLIENT_ORIGIN = "http://localhost:5173" } = process.env;
if (!MONGO_URI || !JWT_SECRET) {
  console.error("Missing MONGO_URI or JWT_SECRET in server/.env");
  process.exit(1);
}

const app = express();
app.use(cors({ origin: CLIENT_ORIGIN }));
app.use(express.json());

app.get("/", (_req, res) => res.json({ name: "TaskFlow API", status: "running", version: "1.0.0" }));
app.get("/api/health", (_req, res) => res.json({ ok: true }));
app.use("/api/auth", authRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/ai", aiRoutes);

// 404 handler for any unmatched route
app.use(notFound);
app.use(errorHandler);

connectDB(MONGO_URI)
  .then(() => app.listen(Number(PORT), () => console.log(`API running on http://localhost:${PORT}`)))
  // .catch((err) => {
  //   console.error("DB connection failed:", err.message);
  //   process.exit(1);
  // });
  .catch((err) => {
  console.error("DB connection failed:");
  console.error(err);
  console.error("Connection reason:", err.reason);
  process.exit(1);
});
