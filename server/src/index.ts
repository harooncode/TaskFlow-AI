import "dotenv/config";
import path from "path";
import fs from "fs";
import express from "express";
import cors from "cors";
import { connectDB } from "./config/db";
import authRoutes from "./routes/auth";
import taskRoutes from "./routes/tasks";
import { errorHandler, notFound } from "./middleware/error";

const { PORT = "5000", MONGO_URI, JWT_SECRET, CLIENT_ORIGIN = "http://localhost:5173" } = process.env;
if (!MONGO_URI || !JWT_SECRET) {
  console.error("Missing MONGO_URI or JWT_SECRET in server/.env");
  process.exit(1);
}

const app = express();
app.use(cors({ origin: CLIENT_ORIGIN }));
app.use(express.json());

app.get("/api/health", (_req, res) => res.json({ ok: true }));
app.use("/api/auth", authRoutes);
app.use("/api/tasks", taskRoutes);

// Serve the built React app in production
const clientDist = path.resolve(__dirname, "../../client/dist");
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get(/^\/(?!api).*/, (_req, res) => res.sendFile(path.join(clientDist, "index.html")));
}

app.use("/api", notFound);
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
