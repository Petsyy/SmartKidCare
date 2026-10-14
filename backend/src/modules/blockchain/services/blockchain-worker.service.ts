import { logger } from "../../../shared/lib/logger";
import { blockchainAnchorService } from "./blockchain-anchor.service";

const POLL_INTERVAL_MS = 30_000;
let timer: NodeJS.Timeout | null = null;
let running = false;

const poll = async () => {
  if (running) return;
  running = true;
  try {
    while (await blockchainAnchorService.processNext()) {}
  } catch (error: unknown) {
    logger.error("🛑 [Blockchain] Worker poll failed.", {
      error: error instanceof Error ? error.message : "Unknown worker error",
    });
  } finally {
    running = false;
  }
};

export const startBlockchainWorker = () => {
  if (timer || process.env.BLOCKCHAIN_WORKER_ENABLED === "false") return;
  void poll();
  timer = setInterval(() => void poll(), POLL_INTERVAL_MS);
  timer.unref();
};

export const stopBlockchainWorker = () => {
  if (timer) clearInterval(timer);
  timer = null;
};
