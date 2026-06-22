import express from "express";
import Analytics from "../models/Analytics.js";
import protect from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", protect, async (req, res) => {
  try {
    const analytics = await Analytics.findOne({
      user: req.user._id,
    });

    res.json(
      analytics || {
        totalChats: 0,
        totalSessions: 0,
        streak: 0,
        masteryScore: 0,
        strongestSubject: "General",
        weakestSubject: "General",
      }
    );
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
});

export default router;