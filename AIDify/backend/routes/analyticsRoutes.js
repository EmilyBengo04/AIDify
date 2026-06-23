import express from "express";
import axios from "axios";
import Analytics from "../models/Analytics.js";
import ChatSession from "../models/ChatSession.js";
import protect from "../middleware/authMiddleware.js";

const router = express.Router();
const model = process.env.OPENROUTER_MODEL || "anthropic/claude-opus-4.8";

router.get("/", protect, async (req, res) => {
  try {
    let analytics = await Analytics.findOne({
      user: req.user._id,
    });

    if (!analytics) {
      analytics = await Analytics.create({ user: req.user._id });
    }

    const subjectStats = [...analytics.subjectStats.entries()].map(
      ([subject, count]) => ({ subject, count })
    );

    res.json({
      totalChats: analytics.totalChats,
      totalSessions: analytics.totalSessions,
      streak: analytics.streak,
      masteryScore: analytics.masteryScore,
      strongestSubject: analytics.strongestSubject,
      weakestSubject: analytics.weakestSubject,
      subjectStats,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
});

router.get("/insights", protect, async (req, res) => {
  try {
    let analytics = await Analytics.findOne({ user: req.user._id });
    if (!analytics) {
      analytics = await Analytics.create({ user: req.user._id });
    }

    const sessionId = req.query.sessionId;
    let recentSession;

    if (sessionId) {
      recentSession = await ChatSession.findOne({
        _id: sessionId,
        user: req.user._id,
      });
    }

    if (!recentSession) {
      recentSession = await ChatSession.findOne({
        user: req.user._id,
      }).sort({ updatedAt: -1 });
    }

    const analyticsSummary = `User analytics:\n- strongestSubject: ${analytics.strongestSubject || "General"}\n- weakestSubject: ${analytics.weakestSubject || "General"}\n- masteryScore: ${analytics.masteryScore}\n- totalChats: ${analytics.totalChats}\n- totalSessions: ${analytics.totalSessions}`;

    const subjectTotals = [...analytics.subjectStats.entries()]
      .map(([subject, count]) => `${subject}: ${count}`)
      .join("; ");

    const sessionSummary = recentSession
      ? `Most recent session subject: ${recentSession.subject || "General"}. Recent messages: ${recentSession.messages
          .slice(-6)
          .map((m) => `${m.role}: ${m.content}`)
          .join(" | ")}`
      : "No recent session data available.";

    if (!process.env.OPENROUTER_API_KEY) {
      return res.status(500).json({
        message: "OpenRouter API key is not configured.",
      });
    }

    const prompt = `Generate exactly four concise recommendations for the learner based on the following analytics and recent chat activity. Use this format exactly:\nStrongest Subject: ...\nNeeds More Practice: ...\nRecent Topic: ...\nRecommended Next: ...\n
${analyticsSummary}\nSubject totals: ${subjectTotals}\n${sessionSummary}`;

    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model,
        messages: [
          {
            role: "system",
            content: "You are a helpful AI tutor assistant. Summarize the student's learning analytics into four concise recommendations.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        max_tokens: 220,
        temperature: 0.75,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const insightText = response.data.choices?.[0]?.message?.content || "";
    const insights = {
      strongest: "Languages",
      weakest: "Physics",
      recent: "Machine Learning",
      next: "Introduction to Neural Networks",
    };

    insightText.split(/\r?\n/).forEach((line) => {
      const [key, ...rest] = line.split(":");
      if (!key || rest.length === 0) return;
      const value = rest.join(":").trim();

      if (key.toLowerCase().includes("strongest")) {
        insights.strongest = value;
      } else if (key.toLowerCase().includes("needs more")) {
        insights.weakest = value;
      } else if (key.toLowerCase().includes("recent")) {
        insights.recent = value;
      } else if (key.toLowerCase().includes("recommended")) {
        insights.next = value;
      }
    });

    res.json({ insights, raw: insightText });
  } catch (error) {
    res.status(500).json({
      message: error.response?.data || error.message,
    });
  }
});

export default router;