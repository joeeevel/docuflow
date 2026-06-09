import { describe, it, expect } from "vitest";
import { formatTimestamp } from "../../src/services/media.js";

describe("formatTimestamp", () => {
  it("formats zero seconds", () => {
    expect(formatTimestamp(0)).toBe("00:00");
  });

  it("formats 65 seconds", () => {
    expect(formatTimestamp(65)).toBe("01:05");
  });

  it("formats 600 seconds", () => {
    expect(formatTimestamp(600)).toBe("10:00");
  });
});
