import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { app } from "../../src/server.js";
import mongoose from "mongoose";

let connected = false;

beforeAll(async () => {
  const uri = process.env.MONGO_URI ?? "mongodb://localhost:27017/docuflow_test";
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 2000 });
    connected = true;
  } catch {
    connected = false;
  }
});

afterAll(async () => {
  if (connected) {
    await mongoose.connection.dropDatabase().catch(() => {});
    await mongoose.disconnect();
  }
});

const itIf = (condition: boolean) => condition ? it : it.skip;

describe("POST /api/jobs", () => {
  itIf(connected)("rejects request without auth token", async () => {
    const res = await request(app)
      .post("/api/jobs")
      .send({ sourceUrl: "https://loom.com/share/test-video" });

    expect(res.status).toBe(401);
  });

  itIf(connected)("rejects invalid URL", async () => {
    const res = await request(app)
      .post("/api/jobs")
      .set("Authorization", "Bearer invalid-token")
      .send({ sourceUrl: "not-a-url" });
    expect(res.status).toBe(400);
  });
});
