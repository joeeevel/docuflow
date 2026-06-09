import { describe, it, expect } from "vitest";
import { buildMarkdown } from "../../src/services/worker.js";
import type { AIOutput } from "../../src/types/index.js";

describe("buildMarkdown", () => {
  const sample: AIOutput = {
    title: "Setup Guide",
    summary: "How to set up the environment",
    prerequisites: ["Node.js 18+", "Docker"],
    steps: [
      {
        stepNumber: 1,
        actionTitle: "Install dependencies",
        detailedExplanation: "Run the install command.",
        codeSnippet: "npm install",
        associatedImageTimestamp: "00:15",
      },
      {
        stepNumber: 2,
        actionTitle: "Start the server",
        detailedExplanation: "Run the dev command.",
        codeSnippet: "npm run dev",
      },
    ],
  };

  it("generates markdown with title", () => {
    const md = buildMarkdown(sample);
    expect(md).toContain("# Setup Guide");
  });

  it("includes prerequisites", () => {
    const md = buildMarkdown(sample);
    expect(md).toContain("- Node.js 18+");
    expect(md).toContain("- Docker");
  });

  it("includes steps with code blocks", () => {
    const md = buildMarkdown(sample);
    expect(md).toContain("### Step 1: Install dependencies");
    expect(md).toContain("npm install");
    expect(md).toContain("### Step 2: Start the server");
    expect(md).toContain("npm run dev");
  });

  it("includes image timestamp reference", () => {
    const md = buildMarkdown(sample);
    expect(md).toContain("Frame at 00:15");
  });
});
