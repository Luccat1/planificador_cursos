import { generateScheduleProposals } from "../domain/scheduler";
import { Period } from "../domain/types";

self.onmessage = (e: MessageEvent<{ period: Period; maxAlternatives?: number }>) => {
  try {
    const { period, maxAlternatives = 5 } = e.data;
    const results = generateScheduleProposals(period, maxAlternatives);
    self.postMessage({ success: true, results });
  } catch (err) {
    self.postMessage({
      success: false,
      error: (err as Error).message,
      isRangeError: err instanceof RangeError
    });
  }
};
