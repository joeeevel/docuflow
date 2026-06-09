import { randomUUID } from "node:crypto";
import { spawn } from "node:child_process";
import path from "node:path";
import fs from "node:fs/promises";
import { createWriteStream } from "node:fs";
import { pipeline } from "node:stream/promises";
import { get } from "node:https";
import { request as httpRequest } from "node:http";

const YT_REGEX = /youtube\.com|youtu\.be/i;

export interface FrameSample {
  timestamp: string;
  base64: string;
}

export interface MediaResult {
  audioPath: string;
  frames: FrameSample[];
}

export async function processMedia(
  sourceUrl: string,
  tmpDir: string,
): Promise<MediaResult> {
  const videoPath = path.join(tmpDir, "input.mp4");
  const audioPath = path.join(tmpDir, "audio.mp3");

  const resolvedUrl = YT_REGEX.test(sourceUrl)
    ? await resolveYouTubeUrl(sourceUrl)
    : sourceUrl;

  const downloadTask = downloadVideo(resolvedUrl, videoPath);

  await downloadTask;
  const frames = await sampleFrames(videoPath);
  await extractAudio(videoPath, audioPath);

  return { audioPath, frames };
}

async function resolveYouTubeUrl(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const proc = spawn("yt-dlp", ["-f", "best[height<=720]", "-g", url]);
    let output = "";
    proc.stdout.on("data", (d: Buffer) => { output += d.toString(); });
    proc.on("error", () => reject(new Error("yt-dlp not installed. Install it with: sudo apt install yt-dlp")));
    proc.on("close", (code) => {
      if (code === 0) resolve(output.trim());
      else reject(new Error("yt-dlp failed to resolve YouTube URL"));
    });
  });
}

async function downloadVideo(url: string, outputPath: string): Promise<void> {
  const ws = createWriteStream(outputPath);
  const proto = url.startsWith("https") ? get : httpRequest;

  return new Promise((resolve, reject) => {
    proto(url, (res) => {
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        res.destroy();
        downloadVideo(res.headers.location, outputPath).then(resolve).catch(reject);
        return;
      }
      pipeline(res, ws).then(resolve).catch(reject);
    }).on("error", reject).end();
  });
}

async function extractAudio(videoPath: string, audioPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const proc = spawn("ffmpeg", [
      "-i", videoPath,
      "-vn", "-acodec", "libmp3lame", "-ab", "128k",
      "-y", audioPath,
    ]);
    proc.on("error", reject);
    proc.on("close", (code) => {
      code === 0 ? resolve() : reject(new Error(`ffmpeg audio extraction failed (exit ${code})`));
    });
  });
}

async function sampleFrames(videoPath: string): Promise<FrameSample[]> {
  const duration = await getVideoDuration(videoPath);
  const count = Math.min(8, Math.max(3, Math.floor(duration / 15)));
  const interval = duration / count;

  const tasks: Promise<FrameSample | null>[] = [];
  for (let i = 0; i < count; i++) {
    const t = Math.round(i * interval);
    tasks.push(captureFrame(videoPath, t));
  }

  const results = await Promise.all(tasks);
  return results.filter((f): f is FrameSample => f !== null);
}

async function captureFrame(videoPath: string, atSeconds: number): Promise<FrameSample | null> {
  const outputPath = `/tmp/${randomUUID()}.jpg`;
  return new Promise((resolve) => {
    const proc = spawn("ffmpeg", [
      "-ss", String(atSeconds),
      "-i", videoPath,
      "-vframes", "1",
      "-q:v", "2",
      "-y", outputPath,
    ]);
    proc.on("close", async (code) => {
      if (code !== 0) { resolve(null); return; }
      try {
        const buffer = await fs.readFile(outputPath);
        await fs.unlink(outputPath);
        resolve({ timestamp: formatTimestamp(atSeconds), base64: buffer.toString("base64") });
      } catch {
        resolve(null);
      }
    });
    proc.on("error", () => resolve(null));
  });
}

async function getVideoDuration(videoPath: string): Promise<number> {
  return new Promise((resolve, reject) => {
    const proc = spawn("ffprobe", [
      "-v", "error",
      "-show_entries", "format=duration",
      "-of", "csv=p=0",
      videoPath,
    ]);
    let out = "";
    proc.stdout.on("data", (d: Buffer) => { out += d.toString(); });
    proc.on("close", (code) => {
      if (code === 0) resolve(Math.ceil(parseFloat(out.trim())));
      else reject(new Error("ffprobe failed"));
    });
    proc.on("error", reject);
  });
}

export function formatTimestamp(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}
