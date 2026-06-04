import express from "express";
import axios from "axios";
import ChatSession from "../models/ChatSession.js";
import protect from "../middleware/authMiddleware.js";

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

  if (text.includes("essay") || text.includes("writing")) {
    return "Writing";
  }

  if (text.includes("swahili") || text.includes("kiswahili") || text.includes("sheng")) {
    return "Languages";
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
