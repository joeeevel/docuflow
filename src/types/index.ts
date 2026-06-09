import type { Request } from "express";

export type JobStatus = "pending" | "processing" | "completed" | "failed";

export type SubscriptionStatus = "active" | "trialing" | "past_due" | "canceled";

export type PlanTier = "free" | "growth" | "agency";

export interface GeneratedDocAsset {
  timestamp: string;
  storageUrl: string;
}

export interface GeneratedDoc {
  title: string;
  summary: string;
  markdownPayload: string;
  assets: GeneratedDocAsset[];
}

export interface AIStep {
  stepNumber: number;
  actionTitle: string;
  detailedExplanation: string;
  codeSnippet?: string;
  associatedImageTimestamp?: string;
}

export interface AIOutput {
  title: string;
  summary: string;
  prerequisites: string[];
  steps: AIStep[];
}

export interface AuthenticatedRequest extends Request {
  userId?: string;
  workspaceId?: string;
}
