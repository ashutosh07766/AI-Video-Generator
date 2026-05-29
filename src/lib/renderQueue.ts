import "server-only";
import { Queue, type ConnectionOptions } from "bullmq";
import IORedis from "ioredis";

// Scalable render path: enqueue jobs to BullMQ (Redis); a separate worker
// process (worker/index.mjs) renders + uploads. Async requires Redis + R2
// (the worker can't stream back to the original request). Without them the
// /api/render route renders synchronously instead.
export const isQueueConfigured =
  !!process.env.REDIS_URL &&
  (!!process.env.S3_ENDPOINT || !!process.env.R2_ACCOUNT_ID);

let queue: Queue | null = null;

function getQueue(): Queue | null {
  if (!process.env.REDIS_URL) return null;
  if (!queue) {
    const connection = new IORedis(process.env.REDIS_URL, {
      maxRetriesPerRequest: null,
    }) as unknown as ConnectionOptions;
    queue = new Queue("render", { connection });
  }
  return queue;
}

export async function enqueueRender(data: {
  id: string;
  inputProps: unknown;
  videoId?: string;
}): Promise<string | null> {
  const q = getQueue();
  if (!q) return null;
  const job = await q.add("render", data, {
    removeOnComplete: 200,
    removeOnFail: 200,
    attempts: 2,
  });
  return job.id ?? null;
}

export type RenderStatus = {
  status: "queued" | "active" | "completed" | "failed" | "not_found";
  url?: string | null;
  progress?: number;
};

export async function getRenderStatus(jobId: string): Promise<RenderStatus> {
  const q = getQueue();
  if (!q) return { status: "not_found" };
  const job = await q.getJob(jobId);
  if (!job) return { status: "not_found" };
  const state = await job.getState();
  const map: Record<string, RenderStatus["status"]> = {
    waiting: "queued",
    delayed: "queued",
    active: "active",
    completed: "completed",
    failed: "failed",
  };
  return {
    status: map[state] ?? "queued",
    url: (job.returnvalue as { url?: string } | undefined)?.url ?? null,
    progress: typeof job.progress === "number" ? job.progress : 0,
  };
}
