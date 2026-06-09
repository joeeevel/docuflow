import { Worker, type Job } from "bullmq";
import path from "node:path";
import fs from "node:fs/promises";
import { env } from "../config/env.js";
import { Job as JobModel } from "../models/Job.js";
import { processMedia } from "./media.js";
import { runAiAnalysis } from "./ai.js";
import type { AIOutput, GeneratedDoc } from "../types/index.js";
import type { FrameSample } from "./media.js";

interface VideoJobData {
  jobId: string;
  sourceUrl: string;
}

let worker: Worker | null = null;

export function startWorker(): Worker {
  if (worker) return worker;

  worker = new Worker<VideoJobData>(
    "video-processing",
    processVideoJob,
    {
      connection: { url: env.redisUrl },
      concurrency: 2,
    },
  );

  worker.on("error", (err) => {
    console.error("Worker error:", err.message);
  });

  worker.on("failed", (job, err) => {
    console.error(`Job ${job?.id} failed:`, err?.message);
  });

  return worker;
}

export function stopWorker(): void {
  if (worker) {
    worker.close();
    worker = null;
  }
}

async function processVideoJob(job: Job<VideoJobData>): Promise<void> {
  const { jobId, sourceUrl } = job.data;
  const tmpDir = path.join("/tmp", jobId);

  await JobModel.findByIdAndUpdate(jobId, { status: "processing" });

  try {
    await fs.mkdir(tmpDir, { recursive: true });

    const { audioPath, frames } = await processMedia(sourceUrl, tmpDir);

    const aiResult: AIOutput = await runAiAnalysis(audioPath, frames);

    const generatedDoc: GeneratedDoc = {
      title: aiResult.title,
      summary: aiResult.summary,
      markdownPayload: buildMarkdown(aiResult, frames),
      assets: aiResult.steps
        .filter((s) => s.associatedImageTimestamp)
        .map((s) => ({
          timestamp: s.associatedImageTimestamp!,
          storageUrl: "",
        })),
    };

    await JobModel.findByIdAndUpdate(jobId, {
      status: "completed",
      generatedDoc,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`Job ${jobId} failed:`, message);
    await JobModel.findByIdAndUpdate(jobId, {
      status: "failed",
      errorLog: message,
    });
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true });
  }
}

function timestampToSeconds(ts: string): number {
  const [m, s] = ts.split(":").map(Number);
  return (m ?? 0) * 60 + (s ?? 0);
}

function findClosestFrame(ts: string, frames: FrameSample[]): FrameSample | undefined {
  const target = timestampToSeconds(ts);
  let closest: FrameSample | undefined;
  let minDiff = Infinity;
  for (const f of frames) {
    const diff = Math.abs(timestampToSeconds(f.timestamp) - target);
    if (diff < minDiff) {
      minDiff = diff;
      closest = f;
    }
  }
  return minDiff <= 30 ? closest : undefined;
}

export function buildMarkdown(ai: AIOutput, frames?: FrameSample[]): string {
  const frameList = frames ?? [];

  const lines: string[] = [];
  lines.push(`# ${ai.title}\n`);
  lines.push(`${ai.summary}\n`);

  if (ai.prerequisites.length > 0) {
    lines.push("## Prerequisites\n");
    for (const prereq of ai.prerequisites) {
      lines.push(`- ${prereq}`);
    }
    lines.push("");
  }

  const usedFrames = new Set<string>();

  lines.push("## Steps\n");
  for (const step of ai.steps) {
    lines.push(`### Step ${step.stepNumber}: ${step.actionTitle}\n`);
    lines.push(`${step.detailedExplanation}\n`);
    if (step.codeSnippet) {
      lines.push("```");
      lines.push(step.codeSnippet);
      lines.push("```\n");
    }
    if (step.associatedImageTimestamp) {
      const match = findClosestFrame(step.associatedImageTimestamp, frameList);
      if (match) {
        usedFrames.add(match.timestamp);
        lines.push(`![Screenshot at ${match.timestamp}](data:image/jpeg;base64,${match.base64})\n`);
      }
    }
  }

  const unused = frameList.filter((f) => !usedFrames.has(f.timestamp));
  if (unused.length > 0) {
    lines.push("## Additional Screenshots\n");
    for (const f of unused) {
      lines.push(`![Frame at ${f.timestamp}](data:image/jpeg;base64,${f.base64})\n`);
    }
  }

  return lines.join("\n");
}
