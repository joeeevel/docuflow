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

export function buildMarkdown(ai: AIOutput, frames?: FrameSample[]): string {
  const frameMap = new Map(frames?.map((f) => [f.timestamp, f.base64]) ?? []);

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
      const b64 = frameMap.get(step.associatedImageTimestamp);
      if (b64) {
        lines.push(`![Frame at ${step.associatedImageTimestamp}](data:image/jpeg;base64,${b64})\n`);
      } else {
        lines.push(`> 📸 Frame at ${step.associatedImageTimestamp}\n`);
      }
    }
  }

  return lines.join("\n");
}
