import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { User } from "../models/User.js";
import { Workspace } from "../models/Workspace.js";
import { registerSchema, loginSchema } from "../validators/auth.js";
import { AppError } from "../middleware/errorHandler.js";

const router = Router();

router.post("/register", async (req, res, next) => {
  try {
    const { email, password, workspaceName } = registerSchema.parse(req.body);

    const existing = await User.findOne({ email });
    if (existing) {
      throw new AppError(409, "Email already registered");
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({ email, passwordHash });

    const workspace = await Workspace.create({
      name: workspaceName,
      ownerId: user._id,
    });

    user.currentWorkspaceId = workspace._id;
    await user.save();

    const token = jwt.sign(
      { userId: user._id.toString(), workspaceId: workspace._id.toString() },
      env.jwtSecret,
      { expiresIn: "7d" },
    );

    res.status(201).json({
      token,
      user: { id: user._id, email: user.email },
      workspace: { id: workspace._id, name: workspace.name },
    });
  } catch (err) {
    next(err);
  }
});

router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    const user = await User.findOne({ email });
    if (!user) {
      throw new AppError(401, "Invalid email or password");
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      throw new AppError(401, "Invalid email or password");
    }

    if (!user.currentWorkspaceId) {
      throw new AppError(400, "User has no workspace assigned");
    }

    const token = jwt.sign(
      {
        userId: user._id.toString(),
        workspaceId: user.currentWorkspaceId.toString(),
      },
      env.jwtSecret,
      { expiresIn: "7d" },
    );

    res.json({
      token,
      user: { id: user._id, email: user.email },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
