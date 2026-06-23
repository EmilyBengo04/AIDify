import mongoose from "mongoose";

const analyticsSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    totalChats: {
      type: Number,
      default: 0,
    },

    totalSessions: {
      type: Number,
      default: 0,
    },

    streak: {
      type: Number,
      default: 1,
    },

    lastActiveDate: {
      type: Date,
    },

    masteryScore: {
      type: Number,
      default: 0,
    },

    strongestSubject: {
      type: String,
      default: "General",
    },

    weakestSubject: {
      type: String,
      default: "General",
    },

    subjectStats: {
      type: Map,
      of: Number,
      default: {},
    },
  },
  { timestamps: true }
);

export default mongoose.model("Analytics", analyticsSchema);