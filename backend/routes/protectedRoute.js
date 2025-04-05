import express from "express";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.get("/protected", protect, (req, res) => {
  res.json({ message: "🔒 Access granted!", user: req.user });
});

export default router;
