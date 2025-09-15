import { describe, it, expect, beforeEach } from "bun:test";
import { makeRetry, retry5 } from "../../src/utils/retry";

describe("retry utility", () => {
  let callCount: number;
  let mockFn: () => Promise<string>;

  beforeEach(() => {
    callCount = 0;
  });

  describe("makeRetry", () => {
    it("should return result on first success", async () => {
      mockFn = async () => {
        callCount++;
        return "success";
      };

      const retryFn = makeRetry({ retries: 3 });
      const result = await retryFn(mockFn);

      expect(result).toBe("success");
      expect(callCount).toBe(1);
    });

    it("should retry on failure and eventually succeed", async () => {
      mockFn = async () => {
        callCount++;
        if (callCount < 3) {
          throw new Error("temporary failure");
        }
        return "success on retry";
      };

      const retryFn = makeRetry({ retries: 5 });
      const result = await retryFn(mockFn);

      expect(result).toBe("success on retry");
      expect(callCount).toBe(3);
    });

    it("should throw error after max retries exceeded", async () => {
      mockFn = async () => {
        callCount++;
        throw new Error("persistent failure");
      };

      const retryFn = makeRetry({ retries: 2 });

      try {
        await retryFn(mockFn);
        expect(true).toBe(false); // Should not reach here
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBe("persistent failure");
        expect(callCount).toBe(3); // Initial attempt + 2 retries
      }
    });

    it("should respect shouldRetry predicate", async () => {
      mockFn = async () => {
        callCount++;
        const error = new Error("specific error");
        (error as any).code = "SHOULD_NOT_RETRY";
        throw error;
      };

      const retryFn = makeRetry({
        retries: 3,
        shouldRetry: (err: unknown) => {
          return !((err as any).code === "SHOULD_NOT_RETRY");
        },
      });

      try {
        await retryFn(mockFn);
        expect(true).toBe(false); // Should not reach here
      } catch (error) {
        expect(callCount).toBe(1); // Should not retry
        expect((error as Error).message).toBe("specific error");
      }
    });

    it("should use exponential backoff with default settings", async () => {
      const startTime = Date.now();
      mockFn = async () => {
        callCount++;
        if (callCount < 3) {
          throw new Error("retry needed");
        }
        return "success";
      };

      const retryFn = makeRetry({ retries: 3, minTimeout: 10 });
      await retryFn(mockFn);

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should take at least some time for retries (10ms + 20ms minimum)
      expect(duration).toBeGreaterThan(25);
      expect(callCount).toBe(3);
    });

    it("should respect custom exponential backoff settings", async () => {
      mockFn = async () => {
        callCount++;
        if (callCount < 2) {
          throw new Error("retry needed");
        }
        return "success";
      };

      const retryFn = makeRetry({
        retries: 2,
        factor: 3,
        minTimeout: 5,
        maxTimeout: 1000,
      });

      const result = await retryFn(mockFn);
      expect(result).toBe("success");
      expect(callCount).toBe(2);
    });

    it("should cap delay at maxTimeout", async () => {
      const startTime = Date.now();
      mockFn = async () => {
        callCount++;
        if (callCount < 3) {
          throw new Error("retry needed");
        }
        return "success";
      };

      const retryFn = makeRetry({
        retries: 3,
        factor: 10,
        minTimeout: 100,
        maxTimeout: 150, // Cap should prevent very long delays
      });

      await retryFn(mockFn);
      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should not take too long due to maxTimeout cap
      expect(duration).toBeLessThan(500);
      expect(callCount).toBe(3);
    });

    it("should handle zero retries", async () => {
      mockFn = async () => {
        callCount++;
        throw new Error("immediate failure");
      };

      const retryFn = makeRetry({ retries: 0 });

      try {
        await retryFn(mockFn);
        expect(true).toBe(false); // Should not reach here
      } catch (error) {
        expect(callCount).toBe(1); // Only initial attempt
        expect((error as Error).message).toBe("immediate failure");
      }
    });
  });

  describe("retry5 helper", () => {
    it("should be configured for 5 retries", async () => {
      mockFn = async () => {
        callCount++;
        throw new Error("always fails");
      };

      try {
        await retry5(mockFn);
        expect(true).toBe(false); // Should not reach here
      } catch (error) {
        expect(callCount).toBe(6); // Initial attempt + 5 retries
        expect((error as Error).message).toBe("always fails");
      }
    });

    it("should work with successful function", async () => {
      mockFn = async () => {
        callCount++;
        return "success";
      };

      const result = await retry5(mockFn);
      expect(result).toBe("success");
      expect(callCount).toBe(1);
    });
  });
});
