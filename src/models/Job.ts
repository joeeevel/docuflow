import mongoose, { Schema, type Document } from "mongoose";
import type { JobStatus, GeneratedDoc } from "../types/index.js";

export interface IJob extends Document {
  workspaceId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  sourceUrl: string;
  status: JobStatus;
  errorLog?: string;
  generatedDoc?: GeneratedDoc;
  createdAt: Date;
  updatedAt: Date;
}

const AssetSchema = new Schema(
  {
    timestamp: { type: String, required: true },
    storageUrl: { type: String, required: true },
  },
  { _id: false },
);

const GeneratedDocSchema = new Schema(
  {
    title: { type: String },
    summary: { type: String },
    markdownPayload: { type: String },
    assets: [AssetSchema],
  },
  { _id: false },
);

const JobSchema = new Schema<IJob>(
  {
    workspaceId: { type: Schema.Types.ObjectId, ref: "Workspace", required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    sourceUrl: { type: String, required: true },
    status: {
      type: String,
      enum: ["pending", "processing", "completed", "failed"],
      default: "pending",
    },
    errorLog: { type: String, default: null },
    generatedDoc: { type: GeneratedDocSchema, default: null },
  },
  { timestamps: true },
);

export const Job = mongoose.model<IJob>("Job", JobSchema);
