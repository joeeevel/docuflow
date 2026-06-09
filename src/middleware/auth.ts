import type { Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import type { AuthenticatedRequest } from "../types/index.js";

interface JwtPayload {
  userId: string;
  workspaceId: string;
}

export function authenticate(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): void {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Missing or invalid authorization header" });
    return;
  }

  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, env.jwtSecret) as JwtPayload;
    req.userId = payload.userId;
    req.workspaceId = payload.workspaceId;
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
}
