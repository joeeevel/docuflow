import express from "express";
import cors from "cors";
import helmet from "helmet";
import { createServer } from "node:http";
import { env } from "./config/env.js";
import { connectDatabase } from "./config/database.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { authRouter, jobsRouter, webhooksRouter } from "./routes/index.js";
import { setupWebSocket } from "./websocket/handler.js";

export const app = express();

app.use(helmet());
app.use(cors({ origin: env.corsOrigin }));
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use("/api/auth", authRouter);
app.use("/api/jobs", jobsRouter);
app.use("/api/webhooks", webhooksRouter);

app.use(errorHandler);

export const httpServer = createServer(app);
setupWebSocket(httpServer);

async function start(): Promise<void> {
  try {
    await connectDatabase();
    httpServer.listen(env.port, () => {
      console.log(`DocuFlow engine running on port ${env.port}`);
    });
  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
}

const isTest = process.env.NODE_ENV === "test" || process.env.VITEST;
if (!isTest) {
  start();
}
