import { connectDatabase } from "./config/database.js";
import { startWorker } from "./services/worker.js";

async function main(): Promise<void> {
  await connectDatabase();
  startWorker();
  console.log("DocuFlow worker started, waiting for jobs...");
}

main().catch((err) => {
  console.error("Worker failed to start:", err);
  process.exit(1);
});
