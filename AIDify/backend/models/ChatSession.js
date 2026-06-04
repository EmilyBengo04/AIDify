import mongoose from "mongoose";

const chatMessageSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      enum: ["user", "assistant"],
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const chatSessionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: {
      type: String,
      default: "New learning chat",
    },
    subject: {
      type: String,
      default: "General",
    },
    learningTrack: {
      topics: {
        type: [String],
        default: [],
      },
      level: {
        type: String,
        default: "beginner",
      },
      summary: {
        type: String,
        default: "",
      },
    },
    messages: {
      type: [chatMessageSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("ChatSession", chatSessionSchema);
