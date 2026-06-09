import mongoose, { Schema, type Document } from "mongoose";
import type { SubscriptionStatus, PlanTier } from "../types/index.js";

export interface IWorkspace extends Document {
  name: string;
  ownerId: mongoose.Types.ObjectId;
  stripeCustomerId?: string;
  subscriptionStatus: SubscriptionStatus;
  planTier: PlanTier;
  createdAt: Date;
}

const WorkspaceSchema = new Schema<IWorkspace>(
  {
    name: { type: String, required: true },
    ownerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    stripeCustomerId: { type: String },
    subscriptionStatus: {
      type: String,
      enum: ["active", "trialing", "past_due", "canceled"],
      default: "active",
    },
    planTier: {
      type: String,
      enum: ["free", "growth", "agency"],
      default: "free",
    },
  },
  { timestamps: true },
);

export const Workspace = mongoose.model<IWorkspace>("Workspace", WorkspaceSchema);
