import { generateScheduleProposals } from "./scheduler";
import { Period, ScheduleProposal } from "./types";

export function runSchedulerAsync(
  period: Period,
  maxAlternatives = 5
): Promise<ScheduleProposal[]> {
  // Use Web Worker in browser environment when supported
  if (typeof window !== "undefined" && typeof Worker !== "undefined") {
    return new Promise((resolve, reject) => {
      try {
        const worker = new Worker(
          new URL("../workers/scheduler.worker.ts", import.meta.url),
          { type: "module" }
        );

        worker.onmessage = (
          e: MessageEvent<{
            success: boolean;
            results?: ScheduleProposal[];
            error?: string;
            isRangeError?: boolean;
          }>
        ) => {
          worker.terminate();
          if (e.data.success && e.data.results) {
            resolve(e.data.results);
          } else {
            if (e.data.isRangeError) {
              reject(new RangeError(e.data.error || "Stack overflow"));
            } else {
              reject(new Error(e.data.error || "Error al calcular horarios"));
            }
          }
        };

        worker.onerror = (err) => {
          worker.terminate();
          reject(err);
        };

        worker.postMessage({ period, maxAlternatives });
      } catch {
        // Fallback if worker construction fails
        setTimeout(() => {
          try {
            resolve(generateScheduleProposals(period, maxAlternatives));
          } catch (err) {
            reject(err);
          }
        }, 0);
      }
    });
  }

  // Fallback for tests or environments without Web Worker (e.g. Node/jsdom)
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      try {
        resolve(generateScheduleProposals(period, maxAlternatives));
      } catch (err) {
        reject(err);
      }
    }, 0);
  });
}

