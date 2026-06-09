import { GoogleGenAI } from "@google/genai";
import { env } from "../config/env.js";
import type { AIOutput } from "../types/index.js";
import type { FrameSample } from "./media.js";
import fs from "node:fs/promises";

const aiClient = new GoogleGenAI({ apiKey: env.geminiApiKey });

const SYSTEM_PROMPT = `You are a technical documentation generator. Given a transcript and visual frames from a video walkthrough, produce a structured JSON document following this exact schema:
{
  "title": "Module or Feature Title Name",
  "summary": "High level description of the business process.",
  "prerequisites": ["Required environments, access permissions, or tools"],
  "steps": [
    {
      "stepNumber": 1,
      "actionTitle": "Actionable imperative sentence",
      "detailedExplanation": "Detailed paragraphs describing technical context.",
      "codeSnippet": "Optional terminal commands or code blocks",
      "associatedImageTimestamp": "01:23"
    }
  ]
}
Return ONLY valid JSON. No markdown wrapping.`;

export async function runAiAnalysis(
  audioPath: string,
  frames: FrameSample[],
): Promise<AIOutput> {
  const audioBuffer = await fs.readFile(audioPath);
  const audioBase64 = audioBuffer.toString("base64");

  const contents = [
    {
      role: "user" as const,
      parts: [
        { text: SYSTEM_PROMPT },
        {
          inlineData: {
            mimeType: "audio/mpeg",
            data: audioBase64,
          },
        },
        ...frames.slice(0, 5).map((f) => ({
          inlineData: {
            mimeType: "image/jpeg" as const,
            data: f.base64,
          },
        })),
      ],
    },
  ];

  const response = await aiClient.models.generateContent({
    model: "gemini-2.5-flash",
    contents,
  });

  const text = response.text;
  if (!text) {
    throw new Error("AI returned empty response");
  }

  const cleaned = text
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  const parsed: AIOutput = JSON.parse(cleaned);

  if (!parsed.title || !parsed.summary || !Array.isArray(parsed.steps)) {
    throw new Error("AI response missing required fields");
  }

  return parsed;
}
