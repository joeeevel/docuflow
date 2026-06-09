import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { AppError } from "../middleware/errorHandler.js";
import { Job } from "../models/Job.js";
import { getQueue } from "../services/queue.js";
import { createJobSchema, jobIdSchema } from "../validators/job.js";
import type { AuthenticatedRequest } from "../types/index.js";

const router = Router();

router.use(authenticate);

router.post("/", async (req: AuthenticatedRequest, res, next) => {
  try {
    const { sourceUrl } = createJobSchema.parse(req.body);
    const job = await Job.create({
      workspaceId: req.workspaceId,
      userId: req.userId,
      sourceUrl,
      status: "pending",
    });

    await getQueue().add("process-video", {
      jobId: job._id.toString(),
      sourceUrl,
    });

    res.status(202).json({ jobId: job._id });
  } catch (err) {
    next(err);
  }
});

router.get("/", async (req: AuthenticatedRequest, res, next) => {
  try {
    const jobs = await Job.find({ workspaceId: req.workspaceId })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    res.json({ jobs });
  } catch (err) {
    next(err);
  }
});

router.get("/:id", async (req: AuthenticatedRequest, res, next) => {
  try {
    const { id } = jobIdSchema.parse(req.params);
    const job = await Job.findOne({ _id: id, workspaceId: req.workspaceId }).lean();

    if (!job) {
      throw new AppError(404, "Job not found");
    }

    res.json({ job });
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", async (req: AuthenticatedRequest, res, next) => {
  try {
    const { id } = jobIdSchema.parse(req.params);
    const job = await Job.findOneAndDelete({
      _id: id,
      workspaceId: req.workspaceId,
    });

    if (!job) {
      throw new AppError(404, "Job not found");
    }

    res.json({ message: "Job deleted" });
  } catch (err) {
    next(err);
  }
});

export default router;
