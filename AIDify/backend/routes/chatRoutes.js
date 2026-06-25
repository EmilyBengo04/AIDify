import express from "express";
import axios from "axios";
import ChatSession from "../models/ChatSession.js";
import protect from "../middleware/authMiddleware.js";
import Analytics from "../models/Analytics.js";
import Flashcard from "../models/Flashcard.js";

const router = express.Router();

const model =
  process.env.OPENROUTER_MODEL ||
  "anthropic/claude-opus-4.8";


const getTextFromClaude = (content) => {
  if (!Array.isArray(content)) {
    return "";
  }

  return content
    .filter((block) => block.type === "text")
    .map((block) => block.text)
    .join("\n")
    .trim();
};

const getSubjectFromMessage = (message) => {
  const text = message.toLowerCase();

  if (text.includes("calculus") || text.includes("derivative") || text.includes("limit")) {
    return "Calculus";
  }

  if (text.includes("physics") || text.includes("motion") || text.includes("force")) {
    return "Physics";
  }

  if (text.includes("biology") || text.includes("photosynthesis")) {
    return "Biology";
  }

  if (text.includes("essay") || text.includes("writing") || text.includes("thesis")) {
    return "Writing";
  }

  if (text.includes("swahili") || text.includes("kiswahili") || text.includes("sheng")) {
    return "Languages";
  }

  if (text.includes("python") || text.includes("programming") || text.includes("coding") || text.includes("algorithm")) {
    return "Python";
  }

  if (text.includes("sql") || text.includes("database") || text.includes("postgres") || text.includes("query")) {
    return "SQL";
  }

  if (text.includes("linux") || text.includes("ubuntu") || text.includes("terminal") || text.includes("server")) {
    return "Linux";
  }

  if (text.includes("data engineering") || text.includes("pipeline") || text.includes("etl") || text.includes("airflow")) {
    return "Data Engineering";
  }

  if (text.includes("machine learning") || text.includes("neural network") || text.includes("ai") || text.includes("deep learning")) {
    return "AI";
  }

  return "General";
};

const buildTitle = (message) => {
  const clean = message.replace(/\s+/g, " ").trim();

  if (clean.length <= 42) {
    return clean || "New learning chat";
  }

  return `${clean.slice(0, 42)}...`;
};

const buildSystemPrompt = (user, session) => `
You are AIDify, a warm AI tutor for Kenyan university students.

Student:
- Name: ${user.name}
- Current subject track: ${session.subject}
- Known learning topics: ${session.learningTrack.topics.join(", ") || "none yet"}
- Level: ${session.learningTrack.level}

Tutor behavior:
- Teach step by step, using simple explanations before formal language.
- Ask one useful follow-up question when it helps continue learning.
- Use English by default, but support Kiswahili and Sheng when the student asks.
- Remember the student's learning path from this session.
- Keep replies focused, friendly, and practical.
- Do not claim to have completed actions outside the chat.
`;

const buildFlashcards = (message, assistantReply, subject) => {
  const cleanMessage = message.trim().replace(/\s+/g, " ");
  const cleanReply = assistantReply.trim().replace(/\s+/g, " ");
  const topic = cleanMessage
    .replace(/^(explain|teach me|what is|how does|why does|can you explain)\s+/i, "")
    .replace(/\?$/i, "")
    .trim();

  const cards = [];

  if (topic) {
    cards.push({
      question: `What is ${topic}?`,
      answer: cleanReply.slice(0, 180) || `Review ${topic} with the tutor to build confidence.`,
    });
  }

  if (subject && subject !== "General") {
    cards.push({
      question: `Why does ${subject} matter for your learning?`,
      answer: `Keep practicing ${subject} with short, focused study sessions.`,
    });
  }

  return cards.slice(0, 2);
};

router.get("/sessions", protect, async (req, res) => {
  const sessions = await ChatSession.find({ user: req.user._id })
    .sort({ updatedAt: -1 })
    .select("title subject learningTrack messages updatedAt createdAt");

  res.json({ sessions });
});

router.post("/sessions", protect, async (req, res) => {
  const session = await ChatSession.create({
    user: req.user._id,
    title: req.body.title || "New learning chat",
    subject: req.body.subject || "General",
  });

  res.status(201).json({ session });
});

router.get("/sessions/:sessionId", protect, async (req, res) => {
  const session = await ChatSession.findOne({
    _id: req.params.sessionId,
    user: req.user._id,
  });

  if (!session) {
    return res.status(404).json({
      message: "Chat session not found",
    });
  }

  res.json({ session });
});

router.get("/flashcards", protect, async (req, res) => {
  const flashcards = await Flashcard.find({ user: req.user._id })
    .sort({ createdAt: -1 })
    .limit(8);

  res.json({ flashcards });
});

router.post("/message", protect, async (req, res) => {
  try {
    const { message, sessionId } = req.body;

    if (!message?.trim()) {
      return res.status(400).json({
        message: "Message is required",
      });
    }

   if (!process.env.OPENROUTER_API_KEY) {
  return res.status(500).json({
    message: "OpenRouter API key is not configured",
  });
}

    let session = sessionId
      ? await ChatSession.findOne({ _id: sessionId, user: req.user._id })
      : null;

    if (!session) {
      session = await ChatSession.create({
        user: req.user._id,
        title: buildTitle(message),
        subject: getSubjectFromMessage(message),
        learningTrack: {
          topics: [getSubjectFromMessage(message)],
          level: "beginner",
        },
      });
    }

    const subject = getSubjectFromMessage(message);

    if (subject !== "General" && !session.learningTrack.topics.includes(subject)) {
      session.learningTrack.topics.push(subject);
    }

    if (session.subject === "General" && subject !== "General") {
      session.subject = subject;
    }

    session.messages.push({
      role: "user",
      content: message.trim(),
    });

    const recentMessages = session.messages.slice(-14).map((chatMessage) => ({
      role: chatMessage.role,
      content: chatMessage.content,
    }));

    const response = await axios.post(
  "https://openrouter.ai/api/v1/chat/completions",
  {
    model,
    messages: [
      {
        role: "system",
        content: buildSystemPrompt(req.user, session),
      },
      ...recentMessages,
    ],
    max_tokens: 900,
    temperature: 0.7,
  },
  {
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
    },
  }
);

const assistantReply =
  response.data.choices?.[0]?.message?.content ||
  "I am here, but I could not generate a full response.";

    session.messages.push({
      role: "assistant",
      content: assistantReply,
    });

    const flashcardsToSave = buildFlashcards(message, assistantReply, session.subject);

    if (flashcardsToSave.length > 0) {
      await Flashcard.insertMany(
        flashcardsToSave.map((card) => ({
          user: req.user._id,
          session: session._id,
          subject: session.subject,
          question: card.question,
          answer: card.answer,
        }))
      );
    }

    let analytics = await Analytics.findOne({
      user: req.user._id,
    });

    if (!analytics) {
      analytics = await Analytics.create({
        user: req.user._id,
      });
    }

    const today = new Date();

    if (!analytics.lastActiveDate) {
      analytics.streak = 1;
    } else {
      const diffDays = Math.floor(
        (today - analytics.lastActiveDate) /
          (1000 * 60 * 60 * 24)
      );

      if (diffDays === 1) {
        analytics.streak += 1;
      } else if (diffDays > 1) {
        analytics.streak = 1;
      }
    }

    analytics.lastActiveDate = today;
    analytics.totalChats += 1;

    analytics.totalSessions =
      await ChatSession.countDocuments({
        user: req.user._id,
      });

    analytics.masteryScore = Math.min(
      100,
      analytics.totalChats * 2
    );

    const currentSubject = session.subject;

    analytics.subjectStats.set(
      currentSubject,
      (analytics.subjectStats.get(currentSubject) || 0) + 1
    );

    const sortedSubjects = [
      ...analytics.subjectStats.entries(),
    ].sort((a, b) => b[1] - a[1]);

    if (sortedSubjects.length > 0) {
      analytics.strongestSubject =
        sortedSubjects[0][0];

      analytics.weakestSubject =
        sortedSubjects[
          sortedSubjects.length - 1
        ][0];
    }

    await analytics.save();

    session.learningTrack.summary = `Last worked on ${session.subject}. Recent focus: ${message.trim().slice(0, 120)}`;

    await session.save();

    res.json({
      session,
      reply: {
        role: "assistant",
        content: assistantReply,
      },
    });
  } catch (error) {
  console.error(
    "OpenRouter Error:",
    error.response?.data || error.message
  );

  if (error.response?.status === 404) {
    return res.status(500).json({
      message:
        `OpenRouter model endpoint not found for model '${model}'. ` +
        `Set OPENROUTER_MODEL to a supported model such as 'anthropic/claude-opus-4.8'.`,
    });
  }

  res.status(500).json({
    message: error.response?.data || error.message,
  });
}
});

export default router;
