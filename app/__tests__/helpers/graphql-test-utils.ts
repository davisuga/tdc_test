import { ExecutionResult, graphql, GraphQLSchema } from "graphql";
import { schema } from "../../src/graphql/schema";

/**
 * Test context type for GraphQL operations
 */
export interface TestContext {
  userId?: string;
  // Add other context properties as needed
}

/**
 * Execute a GraphQL operation for testing
 * @param source - GraphQL query/mutation string
 * @param variableValues - Variables for the operation
 * @param contextValue - Context for the operation
 * @returns Promise with execution result
 */
export async function executeGraphQL<T = any>(
  source: string,
  variableValues?: Record<string, unknown>,
  contextValue?: TestContext
): Promise<ExecutionResult<T>> {
  
  return await graphql({
    schema,
    source,
    variableValues,
    contextValue: contextValue || {},
  });
}

/**
 * Common GraphQL queries for testing
 */
export const TEST_QUERIES = {
  GET_SUBMISSION: `
    query GetSubmission($id: ID!) {
      getSubmission(id: $id) {
        id
        vin
        description
        mileage
        s3Paths
        vehicleAssessment {
          id
          visualScore
          maxScore
          scoreDescription
          marketValueRange
          tradeInValue
          vehicleDetails {
            make
            model
            year
            vin
          }
          conditionIssues {
            id
            issueKey
            title
            description
            icon
          }
        }
      }
    }
  `,
  
  GET_VEHICLE_ASSESSMENT: `
    query GetVehicleAssessment($id: ID!) {
      vehicleAssessment(id: $id) {
        id
        visualScore
        maxScore
        scoreDescription
        marketValueRange
        tradeInValue
        tradeInDescription
        aiConfidence
        aiConfidenceDescription
        vehicleDetails {
          id
          make
          model
          year
          mileage
          vin
        }
        conditionIssues {
          id
          issueKey
          title
          description
          icon
        }
      }
    }
  `,
} as const;

/**
 * Common GraphQL mutations for testing
 */
export const TEST_MUTATIONS = {
  GENERATE_UPLOAD_URLS: `
    mutation GenerateUploadUrls($filenames: [String!]!) {
      generateUploadUrls(filenames: $filenames) {
        url
      }
    }
  `,
  
  CREATE_VIN_SUBMISSION: `
    mutation CreateVinSubmission(
      $vin: String!
      $description: String
      $mileage: Int
      $s3Paths: [String!]!
    ) {
      createVinSubmission(
        vin: $vin
        description: $description
        mileage: $mileage
        s3Paths: $s3Paths
      ) {
        id
        vin
        description
        mileage
        s3Paths
        vehicleAssessment {
          id
          visualScore
        }
      }
    }
  `,
} as const;

/**
 * Mock data for testing
 */
export const MOCK_DATA = {
  vinSubmission: {
    vin: "1HGCM82633A123456",
    description: "Well-maintained vehicle",
    mileage: 75000,
    s3Paths: ["uploads/test/image1.jpg", "uploads/test/image2.jpg"],
  },
  
  vehicleAssessment: {
    visualScore: 85,
    maxScore: 100,
    scoreDescription: "Clean vehicle with light, typical wear.",
    marketValueRange: "$18,900 - $21,400",
    tradeInValue: "$17,350",
    tradeInDescription: "Estimated trade-in assumes ~10% dealer margin...",
    aiConfidence: 78,
    aiConfidenceDescription: "Medium confidence based on 2 photos...",
  },
  
  vehicleDetails: {
    make: "Honda",
    model: "Civic",
    year: 2020,
    mileage: "75000",
    vin: "1HGCM82633A123456",
  },
  
  conditionIssues: [
    {
      issueKey: "exterior_scratches" as const,
      title: "Minor scratches",
      description: "Light scratches on passenger door",
      icon: "Car",
    },
  ],
} as const;