import { GoogleGenAI } from "@google/genai";
import { env } from "../config/env.js";
import type { AIOutput } from "../types/index.js";
import type { FrameSample } from "./media.js";
import fs from "node:fs/promises";

const GEMINI_MODELS = ["gemini-2.0-flash", "gemini-2.5-flash", "gemini-1.5-flash"];
const PUTER_MODELS = ["claude-sonnet-4-6", "claude-haiku-4-5"];
const MAX_RETRIES = 2;

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

async function tryGemini(
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
      const shouldRetry = err instanceof Error && (
        err.message.includes("503") ||
        err.message.includes("UNAVAILABLE") ||
        err.message.includes("429") ||
        err.message.includes("RESOURCE_EXHAUSTED") ||
        err.message.includes("quota")
      );

      if (!shouldRetry || attempt === MAX_RETRIES) {
        console.warn(`Gemini ${model} attempt ${attempt} failed:`, err instanceof Error ? err.message.slice(0, 100) : err);
        return null;
      }

      const delay = attempt * 2000;
      console.warn(`Gemini ${model} retry ${attempt}/${MAX_RETRIES} in ${delay}ms`);
      await new Promise((r) => setTimeout(r, delay));
    }
  }

  return null;
}

async function tryPuter(
  model: string,
  audioBase64: string,
  frames: FrameSample[],
): Promise<AIOutput | null> {
  try {
    const { init } = await import("@heyputer/puter.js/src/init.cjs");
    if (!env.puterAuthToken) {
      console.warn("Puter auth token not set, skipping");
      return null;
    }

    const puter = init(env.puterAuthToken);

    const messages = [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: [
          { type: "text", text: "Generate documentation from this video transcript and screenshots." },
          { type: "text", text: `Audio transcript (base64 length: ${audioBase64.length} chars)` },
          ...frames.slice(0, 5).map((f, i) => ({
            type: "text" as const,
            text: `Frame ${i + 1} at ${f.timestamp}: [base64 image data, ${f.base64.length} chars]`,
          })),
        ],
      },
    ];

    const response = await puter.ai.chat(messages, { model });
    const content: unknown = response?.message?.content;
    const text = typeof response === "string"
      ? response
      : Array.isArray(content)
        ? typeof content[0] === "object" && content[0] && "text" in content[0]
          ? String((content[0] as Record<string, unknown>).text)
          : String(content[0] ?? "")
        : typeof content === "string"
          ? content
          : response?.toString();

    if (!text) return null;

    const cleaned = text
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();

    const parsed: AIOutput = JSON.parse(cleaned);
    if (!parsed.title || !parsed.summary || !Array.isArray(parsed.steps)) return null;
    return parsed;
  } catch (err) {
    console.warn(`Puter ${model} failed:`, err instanceof Error ? err.message.slice(0, 100) : err);
    return null;
  }
}

export async function runAiAnalysis(
  audioPath: string,
  frames: FrameSample[],
): Promise<AIOutput> {
  const audioBuffer = await fs.readFile(audioPath);
  const audioBase64 = audioBuffer.toString("base64");

  // Try Gemini models first (multimodal with audio + images)
  for (const model of GEMINI_MODELS) {
    console.log(`Trying Gemini: ${model}`);
    const result = await tryGemini(model, audioBase64, frames);
    if (result) return result;
  }

  // Fallback to Puter.js Claude models (text-only prompt)
  for (const model of PUTER_MODELS) {
    console.log(`Trying Puter: ${model}`);
    const result = await tryPuter(model, audioBase64, frames);
    if (result) return result;
  }

  throw new Error("All AI providers unavailable");
}
