import "server-only";

// ── Render queue seam (plan B2.3 / B5) ───────────────────────────────
// Abstract JobQueue so render orchestration is decoupled from infra.
// MVP uses an in-memory queue (single process). Swap for BullMQ + Redis
// at scale by implementing this same interface — callers don't change.

export type JobStatus = "queued" | "running" | "done" | "failed";
export type Job<T> = {
  id: string;
  status: JobStatus;
  progress: number;
  result?: T;
  error?: string;
};

export interface JobQueue<TInput, TOutput> {
  enqueue(id: string, input: TInput): Promise<Job<TOutput>>;
  get(id: string): Job<TOutput> | undefined;
}

export function createInMemoryQueue<TInput, TOutput>(
  worker: (input: TInput, onProgress: (p: number) => void) => Promise<TOutput>,
): JobQueue<TInput, TOutput> {
  const jobs = new Map<string, Job<TOutput>>();
  return {
    async enqueue(id, input) {
      const job: Job<TOutput> = { id, status: "queued", progress: 0 };
      jobs.set(id, job);
      job.status = "running";
      try {
        job.result = await worker(input, (p) => (job.progress = p));
        job.status = "done";
        job.progress = 1;
      } catch (err) {
        job.status = "failed";
        job.error = (err as Error).message;
      }
      return job;
    },
    get(id) {
      return jobs.get(id);
    },
  };
}
