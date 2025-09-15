export type RetryOptions = {
  retries: number;
  factor?: number;        // exponential backoff factor
  minTimeout?: number;    // ms
  maxTimeout?: number;    // ms
  shouldRetry?: (err: unknown) => boolean;
};

const sleep = (ms: number) => new Promise<void>(res => setTimeout(res, ms));

export function makeRetry<T>(options: RetryOptions) {
  return async (fn: () => Promise<T>): Promise<T> => {
    const {
      retries,
      factor = 2,
      minTimeout = 100,
      maxTimeout = 5000,
      shouldRetry = () => true,
    } = options;

    let attempt = 0;
    let delay = minTimeout;

    while (true) {
      try {
        return await fn();
      } catch (err) {
        attempt++;
        if (attempt > retries || !shouldRetry(err)) {
          throw err;
        }
        await sleep(delay);
        delay = Math.min(delay * factor, maxTimeout);
      }
    }
  };
}

export const retry5 = makeRetry({ retries: 5 });