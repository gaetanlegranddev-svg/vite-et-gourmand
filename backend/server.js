import dotenv from "dotenv";
dotenv.config({ path: "./backend/.env" });

import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import { pool } from "./config/db.js";
import authRoutes from "./routes/auth.js";
import menuRoutes from "./routes/menuRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import hourRoutes from "./routes/hourRoutes.js";

const app = express();
app.use(cors());
app.use(express.json());

pool.connect()
  .then(() => console.log("PostgreSQL connected"))
  .catch(err => console.error("PostgreSQL error:", err));

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.error("MongoDB error:", err));

app.get("/", (req, res) => {
  res.json({ message: "Vite & Gourmand API is running" });
});

app.use("/api/auth", authRoutes);
app.use("/api/menus", menuRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/hours", hourRoutes);

app.use((err, req, res, next) => {
  res.status(err.status || 500).json({ message: err.message || "Server error." });
});

const PORT = 3000;
app.listen(PORT, () => console.log("Server running on port " + PORT));
