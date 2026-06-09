import "dotenv/config";

export const env = {
  port: parseInt(process.env.PORT ?? "3000", 10),
  nodeEnv: process.env.NODE_ENV ?? "development",
  mongoUri: process.env.MONGO_URI ?? "mongodb://localhost:27017/docuflow",
  redisUrl: process.env.REDIS_URL ?? "redis://localhost:6379",
  jwtSecret: process.env.JWT_SECRET ?? "dev-secret-change-in-production",
  stripeSecretKey: process.env.STRIPE_SECRET_KEY ?? "",
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET ?? "",
  geminiApiKey: process.env.GEMINI_API_KEY ?? "",
  puterAuthToken: process.env.PUTER_AUTH_TOKEN ?? "",
  corsOrigin: process.env.CORS_ORIGIN ?? "http://localhost:5173",
} as const;
