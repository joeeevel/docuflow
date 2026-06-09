import { Server as HttpServer } from "node:http";
import { WebSocketServer, WebSocket } from "ws";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

interface JwtPayload {
  userId: string;
  workspaceId: string;
}

const clients = new Map<string, Set<WebSocket>>();

export function setupWebSocket(server: HttpServer): WebSocketServer {
  const wss = new WebSocketServer({ server, path: "/ws" });

  wss.on("connection", (ws, req) => {
    const url = new URL(req.url ?? "", `http://${req.headers.host}`);
    const token = url.searchParams.get("token");

    if (!token) {
      ws.close(4001, "Authentication required");
      return;
    }

    let payload: JwtPayload;
    try {
      payload = jwt.verify(token, env.jwtSecret) as JwtPayload;
    } catch {
      ws.close(4001, "Invalid token");
      return;
    }

    const userId = payload.userId;
    if (!clients.has(userId)) {
      clients.set(userId, new Set());
    }
    clients.get(userId)!.add(ws);

    ws.on("close", () => {
      clients.get(userId)?.delete(ws);
      if (clients.get(userId)?.size === 0) {
        clients.delete(userId);
      }
    });
  });

  return wss;
}

export function notifyUser(userId: string, event: string, data: unknown): void {
  const userSockets = clients.get(userId);
  if (!userSockets) return;

  const message = JSON.stringify({ event, data });
  for (const ws of userSockets) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(message);
    }
  }
}
