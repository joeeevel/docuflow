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

describe("POST /api/auth", () => {
  itIf(connected)("registers a new user", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ email: "test@docuflow.dev", password: "password123", workspaceName: "Test Workspace" });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("token");
    expect(res.body.user.email).toBe("test@docuflow.dev");
  });
});
