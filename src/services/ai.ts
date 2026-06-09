import { GoogleGenAI } from "@google/genai";
import { env } from "../config/env.js";
import type { AIOutput } from "../types/index.js";
import type { FrameSample } from "./media.js";
import fs from "node:fs/promises";

const MODELS = ["gemini-2.0-flash", "gemini-2.5-flash", "gemini-1.5-flash"];
const MAX_RETRIES = 3;

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

async function tryModel(
  model: string,
  audioBase64: string,
  frames: FrameSample[],
): Promise<AIOutput | null> {
  const contents = [
    {
      role: "user" as const,
      parts: [
        { text: SYSTEM_PROMPT },
        {
          inlineData: { mimeType: "audio/mpeg", data: audioBase64 },
        },
        ...frames.slice(0, 5).map((f) => ({
          inlineData: { mimeType: "image/jpeg" as const, data: f.base64 },
        })),
      ],
    },
  ];

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await aiClient.models.generateContent({ model, contents });
      const text = response.text;
      if (!text) return null;

      const cleaned = text
        .replace(/^```(?:json)?\s*/i, "")
        .replace(/\s*```$/i, "")
        .trim();

      const parsed: AIOutput = JSON.parse(cleaned);
      if (!parsed.title || !parsed.summary || !Array.isArray(parsed.steps)) return null;
      return parsed;
    } catch (err) {
      const isOverload = err instanceof Error && (
        err.message.includes("503") ||
        err.message.includes("UNAVAILABLE") ||
        err.message.includes("high demand")
      );

      if (!isOverload || attempt === MAX_RETRIES) {
        console.warn(`Model ${model} attempt ${attempt} failed:`, err instanceof Error ? err.message : err);
        return null;
      }

      const delay = attempt * 2000;
      console.warn(`Model ${model} overloaded, retry ${attempt}/${MAX_RETRIES} in ${delay}ms`);
      await new Promise((r) => setTimeout(r, delay));
    }
  }

  return null;
}

export async function runAiAnalysis(
  audioPath: string,
  frames: FrameSample[],
): Promise<AIOutput> {
  const audioBuffer = await fs.readFile(audioPath);
  const audioBase64 = audioBuffer.toString("base64");

  const errors: string[] = [];

  for (const model of MODELS) {
    console.log(`Trying AI model: ${model}`);
    const result = await tryModel(model, audioBase64, frames);
    if (result) return result;
    errors.push(`${model} failed`);
  }

  throw new Error(`All AI models unavailable. Last errors: ${errors.join("; ")}`);
}
