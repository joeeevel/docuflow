import { Queue } from "bullmq";
import { env } from "../config/env.js";

let queue: Queue | null = null;

export function getQueue(): Queue {
  if (!queue) {
    queue = new Queue("video-processing", {
      connection: { url: env.redisUrl },
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: "exponential", delay: 2000 },
        removeOnComplete: true,
        removeOnFail: false,
      },
    });
  }
  return queue;
}
