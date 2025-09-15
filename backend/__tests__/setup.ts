import { vi } from "vitest";
import type { MockedFunction } from "vitest";

// Mock environment variables for tests
process.env.MARKETCHECK_API_KEY = "test-marketcheck-key";
process.env.GOOGLE_GENERATIVE_AI_API_KEY = "test-google-ai-key";
process.env.S3_ENDPOINT = "test-s3-endpoint";
process.env.S3_ACCESS_KEY_ID = "test-access-key";
process.env.S3_SECRET_ACCESS_KEY = "test-secret-key";
process.env.DB_URL = "postgresql://test:test@localhost:5432/test_db";
process.env.NODE_ENV = "test";

// Mock external services by default
vi.mock("@ai-sdk/google", () => ({
  google: vi.fn(() => ({
    generateObject: vi.fn(),
  })),
}));

vi.mock("ai", () => ({
  generateObject: vi.fn(),
}));

// Mock S3 client
vi.mock("bun", async (importOriginal) => {
  const original = await importOriginal<typeof import("bun")>();
  return {
    ...original,
    S3Client: vi.fn().mockImplementation(() => ({
      presign: vi.fn().mockReturnValue("https://mock-presigned-url.com"),
      file: vi.fn().mockReturnValue({
        arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(1024)),
      }),
    })),
  };
});

// Mock fetch for external API calls
global.fetch = vi.fn() as MockedFunction<typeof fetch>;

// Reset all mocks before each test
beforeEach(() => {
  vi.clearAllMocks();
});

// Global test utilities
declare global {
  // Add custom matchers or utilities here if needed
  var testUtils: {
    mockFetch: MockedFunction<typeof fetch>;
  };
}

globalThis.testUtils = {
  mockFetch: global.fetch as MockedFunction<typeof fetch>,
};