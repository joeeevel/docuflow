import { describe, it, expect } from "vitest";
import { createJobSchema, registerSchema, loginSchema } from "../../src/validators/index.js";

describe("createJobSchema", () => {
  it("accepts a valid URL", () => {
    const result = createJobSchema.parse({ sourceUrl: "https://loom.com/share/abc123" });
    expect(result.sourceUrl).toBe("https://loom.com/share/abc123");
  });

  it("rejects an invalid URL", () => {
    expect(() => createJobSchema.parse({ sourceUrl: "not-a-url" })).toThrow();
  });

  it("rejects missing sourceUrl", () => {
    expect(() => createJobSchema.parse({})).toThrow();
  });
});

describe("registerSchema", () => {
  it("accepts valid registration data", () => {
    const data = { email: "test@example.com", password: "password123", workspaceName: "My Workspace" };
    expect(registerSchema.parse(data)).toEqual(data);
  });

  it("rejects invalid email", () => {
    expect(() => registerSchema.parse({ email: "bad", password: "password123", workspaceName: "W" })).toThrow();
  });

  it("rejects short password", () => {
    expect(() => registerSchema.parse({ email: "a@b.com", password: "123", workspaceName: "W" })).toThrow();
  });
});

describe("loginSchema", () => {
  it("accepts valid login data", () => {
    const data = { email: "a@b.com", password: "somepass" };
    expect(loginSchema.parse(data)).toEqual(data);
  });

  it("rejects empty password", () => {
    expect(() => loginSchema.parse({ email: "a@b.com", password: "" })).toThrow();
  });
});
