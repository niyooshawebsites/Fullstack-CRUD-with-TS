import type { Request, Response } from "express";
import type { RegisterBody } from "../schemas/auth.schema.js";
import { User } from "../models/user.model.js";
import {
  generateRefreshToken,
  generateAccessToken,
} from "../utils/jwt.util.js";
import jwt from "jsonwebtoken";
import { Session } from "../models/session.model.js";
import { hashToken } from "../utils/tokenHash.js";
import { UAParser } from "ua-parser-js";

export const registerUser = async (
  req: Request<{}, {}, RegisterBody>,
  res: Response,
) => {
  try {
    const { name, email, password } = req.body;
    const userExists = await User.findOne({ email });

    if (userExists)
      return res
        .status(409)
        .json({ success: false, message: "User already exists" });

    await User.create({
      name,
      email,
      password,
    });

    return res
      .status(201)
      .json({ success: true, message: "User created successfully" });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

export const loginUser = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const accessToken = generateAccessToken(user._id.toString());
    const refreshToken = generateRefreshToken(user._id.toString());
    const hashedRefreshToken = hashToken(refreshToken);

    const parser = new UAParser(req.headers["user-agent"]);

    const device = parser.getDevice();
    const browser = parser.getBrowser();
    const os = parser.getOS();

    await Session.create({
      userId: user._id,
      refreshTokenHash: hashedRefreshToken,
      ip: req.ip || "unknown",
      userAgent: req.headers["user-agent"] || "unknown",
      device: device.model || device.type || "Desktop",
      browser: browser.name || "Unknown",
      os: os.name || "Unknown",
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    res.cookie("accessToken", accessToken, {
      httpOnly: process.env.COOKIE_HTTPONLY === "true",
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 15 * 60 * 1000, // 15 minutes
      path: "/",
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: process.env.COOKIE_HTTPONLY === "true",
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 day
      path: "/",
    });

    return res.status(200).json({
      success: true,
      message: "Login successful",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const refreshToken = async (req: Request, res: Response) => {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    return res.status(401).json({
      success: false,
      message: "Refresh token missing",
    });
  }

  try {
    const decoded = jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET as string,
    ) as { id: string };

    if (!decoded) {
      return res.status(401).json({
        success: false,
        message: "Invalid token",
      });
    }

    const hashedToken = hashToken(refreshToken);

    const session = await Session.findOne({
      refreshTokenHash: hashedToken,
    });

    // TOKEN REUSE DETECTION
    if (!session) {
      await Session.deleteMany({
        userId: decoded.id,
      });

      return res.status(403).json({
        success: false,
        message: "Refresh token reuse detected",
      });
    }

    // session expiry
    if (session.expiresAt < new Date()) {
      await Session.deleteOne({ _id: session._id });

      return res.status(403).json({
        success: false,
        message: "Session expired. Please login again.",
      });
    }

    // delete old session
    await Session.deleteOne({ _id: session._id });

    const newRefreshToken = generateRefreshToken(decoded.id);
    const accessToken = generateAccessToken(decoded.id);

    const newRefreshTokenHash = hashToken(newRefreshToken);

    const parser = new UAParser(req.headers["user-agent"]);
    const device = parser.getDevice();
    const browser = parser.getBrowser();
    const os = parser.getOS();

    await Session.create({
      userId: decoded.id,
      refreshTokenHash: newRefreshTokenHash,
      ip: req.ip || "unknown",
      userAgent: req.headers["user-agent"] || "unknown",
      device: device.model || device.type || "Desktop",
      browser: browser.name || "Unknown",
      os: os.name || "Unknown",
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    res.cookie("accessToken", accessToken, {
      httpOnly: process.env.COOKIE_HTTPONLY === "true",
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 15 * 60 * 1000,
      path: "/",
    });

    res.cookie("refreshToken", newRefreshToken, {
      httpOnly: process.env.COOKIE_HTTPONLY === "true",
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: "/",
    });

    return res.json({
      success: true,
      message: "Tokens refreshed",
    });
  } catch (error) {
    return res.status(403).json({
      success: false,
      message: "Invalid refresh token",
    });
  }
};

export const logoutUser = async (req: Request, res: Response) => {
  const token = req.cookies.refreshToken;

  if (!token) {
    return res.status(400).json({
      success: false,
      message: "No refresh token, no logout",
    });
  }

  const hashedRefreshToken = hashToken(token);
  await Session.deleteOne({ refreshTokenHash: hashedRefreshToken });

  res.clearCookie("accessToken");
  res.clearCookie("refreshToken");

  return res.status(200).json({
    success: true,
    message: "Logged out successfully",
  });
};

export const logoutUserEverywhere = async (req: Request, res: Response) => {
  const userId = req.user?._id;
  if (!userId) {
    throw new Error("User ID missing");
  }
  await Session.deleteMany({ userId });

  res.clearCookie("accessToken");
  res.clearCookie("refreshToken");

  return res.status(200).json({
    success: true,
    message: "Logged out from all devices",
  });
};
