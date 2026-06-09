import { z } from "zod";

export const createJobSchema = z.object({
  sourceUrl: z.string().url("Must be a valid URL"),
});

export const jobIdSchema = z.object({
  id: z.string().length(24, "Invalid job ID"),
});
