import mongoose, { mongo } from "mongoose";
import type { Document } from "mongoose";
import type { ISession } from "../types/session.types.js";

export interface ISessionDocument extends ISession, Document {}

const sessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    refreshTokenHash: {
      type: String,
      required: true,
    },
    userAgent: {
      type: String,
    },
    ip: {
      type: String,
    },
    device: {
      type: String,
    },
    browser: {
      type: String,
    },
    os: {
      type: String,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 }, // Now MongoDB automatically deletes expired sessions.
    },
    isRevoked: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

export const Session = mongoose.model<ISessionDocument>(
  "Session",
  sessionSchema,
);
