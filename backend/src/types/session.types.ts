import mongoose from "mongoose";

export interface ISession {
  userId: mongoose.Types.ObjectId;
  refreshTokenHash: string;
  userAgent?: string;
  ip?: string;
  device?: string;
  browser?: string;
  os: string;
  expiresAt: Date;
  isRevoked: boolean;
}
