import { promisify } from "node:util";
import { randomUUID } from "node:crypto";
import { exec as execCallback } from "node:child_process";
import path from "node:path";
import fs from "node:fs/promises";

const exec = promisify(execCallback);

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

  await downloadVideo(sourceUrl, videoPath);
  await extractAudio(videoPath, audioPath);
  const frames = await sampleFrames(videoPath);

  return { audioPath, frames };
}

async function downloadVideo(url: string, outputPath: string): Promise<void> {
  const { stdout } = await exec(
    `curl -L -o "${outputPath}" "${url}"`,
  );
}

async function extractAudio(videoPath: string, audioPath: string): Promise<void> {
  await exec(
    `ffmpeg -i "${videoPath}" -vn -acodec libmp3lame -ab 128k "${audioPath}" -y`,
  );
}

async function sampleFrames(videoPath: string): Promise<FrameSample[]> {
  const duration = await getVideoDuration(videoPath);
  const interval = Math.max(10, Math.floor(duration / 10));
  const frames: FrameSample[] = [];

  for (let t = 0; t < duration; t += interval) {
    const ts = formatTimestamp(t);
    const outputPath = `/tmp/${randomUUID()}.jpg`;
    try {
      await exec(`ffmpeg -ss ${t} -i "${videoPath}" -vframes 1 -q:v 2 "${outputPath}" -y`);
      const buffer = await fs.readFile(outputPath);
      frames.push({ timestamp: ts, base64: buffer.toString("base64") });
      await fs.unlink(outputPath);
    } catch {
      // skip frame on error
    }
  }

  return frames;
}

async function getVideoDuration(videoPath: string): Promise<number> {
  const { stdout } = await exec(
    `ffprobe -v error -show_entries format=duration -of csv=p=0 "${videoPath}"`,
  );
  return Math.ceil(parseFloat(stdout.trim()));
}

export function formatTimestamp(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}
