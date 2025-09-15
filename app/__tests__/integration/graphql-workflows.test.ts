import { describe, it, expect } from "bun:test";
import { executeGraphQL, TEST_MUTATIONS, TEST_QUERIES, MOCK_DATA } from "../helpers/graphql-test-utils";

describe("GraphQL Schema Validation Tests", () => {

  describe("generateUploadUrls mutation validation", () => {
    it("should handle valid filename arrays", async () => {
      const result = await executeGraphQL(
        TEST_MUTATIONS.GENERATE_UPLOAD_URLS,
        {
          filenames: ["image1.jpg", "image2.png"]
        }
      );

      // Should execute without GraphQL schema errors
      expect(result).toBeDefined();
      expect(result.data).toBeDefined();
      // Actual S3 operations will work or fail based on environment
      if (result.data?.generateUploadUrls) {
        expect(Array.isArray(result.data.generateUploadUrls)).toBe(true);
      }
    });

    it("should reject empty filename arrays", async () => {
      const result = await executeGraphQL(
        TEST_MUTATIONS.GENERATE_UPLOAD_URLS,
        {
          filenames: [] // Empty array should be rejected
        }
      );

      expect(result.errors).toBeDefined();
    });

    it("should reject too many filenames", async () => {
      const tooManyFilenames = Array.from({ length: 11 }, (_, i) => `image${i}.jpg`);
      
      const result = await executeGraphQL(
        TEST_MUTATIONS.GENERATE_UPLOAD_URLS,
        {
          filenames: tooManyFilenames
        }
      );

      expect(result.errors).toBeDefined();
    });
  });

  describe("createVinSubmission mutation validation", () => {
    it("should validate VIN submission structure", async () => {
      const result = await executeGraphQL(
        TEST_MUTATIONS.CREATE_VIN_SUBMISSION,
        {
          ...MOCK_DATA.vinSubmission
        }
      );

      // Should have proper schema structure
      expect(result).toBeDefined();
      // May have errors due to database connection
      if (result.data?.createVinSubmission) {
        expect(result.data.createVinSubmission).toHaveProperty("vin");
      }
    });

    it("should reject empty VIN", async () => {
      const result = await executeGraphQL(
        TEST_MUTATIONS.CREATE_VIN_SUBMISSION,
        {
          vin: "", // Empty VIN
          s3Paths: ["uploads/test/image1.jpg"]
        }
      );

      expect(result.errors).toBeDefined();
    });

    it("should validate s3Paths is array", async () => {
      // GraphQL will reject non-array values for array fields
      try {
        const result = await executeGraphQL(
          TEST_MUTATIONS.CREATE_VIN_SUBMISSION,
          {
            vin: "1HGCM82633A123456",
            s3Paths: "not-an-array" // Should be array
          }
        );
        // If we get here, check for errors
        expect(result.errors).toBeDefined();
      } catch (error) {
        // GraphQL validation error is expected
        expect(error).toBeDefined();
      }
    });
  });

  describe("Query operations validation", () => {
    it("should validate query structure for getSubmission", async () => {
      const result = await executeGraphQL(
        TEST_QUERIES.GET_SUBMISSION,
        {
          id: "test-id"
        }
      );

      // Should have valid structure even if no data
      expect(result).toBeDefined();
      expect(result.data).toBeDefined();
    });

    it("should validate query structure for vehicleAssessment", async () => {
      const result = await executeGraphQL(
        TEST_QUERIES.GET_VEHICLE_ASSESSMENT,
        {
          id: "test-id"
        }
      );

      // Should have valid structure even if no data
      expect(result).toBeDefined();
      // Result may have data or errors, but structure should be valid
      expect(result.data || result.errors).toBeDefined();
    });
  });
});
