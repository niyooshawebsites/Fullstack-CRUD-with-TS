import type { Request, Response } from "express";
import { User } from "../models/user.model.js";
import jwt from "jsonwebtoken";

export const registerUser = async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;
    const userExists = await User.findOne({ email });

    if (userExists)
      return res
        .status(409)
        .json({ success: false, message: "User already exists" });

    const user = await User.create({
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
