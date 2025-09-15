# 🚗 Automated Vehicle Assessment API

This project is a backend service developed as a take-home test, focusing on automating the assessment of vehicle condition and market value using AI and external data sources. It provides a GraphQL API for VIN submission, photo upload management, and retrieval of detailed vehicle assessments.

## ✨ Features

*   **GraphQL API**: Exposed via Pothos, providing structured endpoints for interacting with the system.
*   **VIN Submission**: Users can submit VINs, vehicle descriptions, mileage, and S3 photo paths.
*   **Secure Photo Uploads**: Generates presigned S3 URLs for clients to directly upload photos, ensuring security and scalability.
*   **AI-Powered Visual Inspection**: Leverages Google Gemini (via `@ai-sdk/google`) to analyze vehicle photos for condition issues like dents, scratches, rust, interior wear, etc.
*   **NHTSA Integration**: Decodes VINs to retrieve manufacturer, model, and year information.
*   **MarketCheck Integration**: Fetches comparable vehicle listings to estimate market value and trade-in value.
*   **Asynchronous Assessment**: The intensive AI and external API calls for assessment are performed asynchronously to keep the submission API responsive.
*   **Database Persistence**: Stores VIN submissions, vehicle details, assessments, and condition issues using Prisma and PostgreSQL.
*   **Retry Mechanism**: A generic retry utility (`src/utils/retry.ts`) for resilient external API calls.
*   **Comprehensive Testing**: Unit and integration tests cover core logic and API workflows.

## 💻 Tech Stack

*   **Runtime**: [Bun](https://bun.sh/)
*   **Backend Framework**: [graphql-yoga](https://the-guild.dev/graphql/yoga/docs)
*   **GraphQL Schema Builder**: [Pothos GraphQL](https://pothos-graphql.dev/)
*   **ORM**: [Prisma](https://www.prisma.io/)
*   **Database**: PostgreSQL
*   **AI SDK**: [`@ai-sdk/google`](https://sdk.vercel.ai/docs/reference/google-generative-ai) (for Google Gemini)
*   **Cloud Storage**: S3-compatible storage (e.g., Backblaze B2)
*   **Environment Validation**: [Zod](https://zod.dev/)
*   **Testing**: [Bun.test](https://bun.sh/docs/test) (compatible with Vitest)
*   **HTTP Client**: Built-in `fetch`

## ⚙️ Getting Started

Follow these instructions to get a local copy of the project up and running.

### Prerequisites

*   **Bun**: Install Bun (the JavaScript runtime and package manager).
    ```bash
    curl -fsSL https://bun.sh/install | bash
    ```
*   **Docker**: Required for running a local PostgreSQL database easily.
*   **Git**: For cloning the repository.

### Installation

1.  **Clone the repository**:
    ```bash
    git clone <your-repository-url>
    cd automated-vehicle-assessment
    ```

2.  **Install dependencies**:
    ```bash
    bun install
    ```

### Environment Variables

Create a `.env` file in the root of the project and populate it with the following variables:

*   `MARKETCHECK_API_KEY`: Your API key for the MarketCheck API.
*   `GOOGLE_GENERATIVE_AI_API_KEY`: Your API key for Google Gemini.
*   `DB_URL`: Connection string for your PostgreSQL database.
*   `S3_ENDPOINT`: The endpoint URL for your S3-compatible storage (e.g., `s3.us-west-001.backblazeb2.com` for Backblaze B2).
*   `S3_ACCESS_KEY_ID`: Your S3 access key ID.
*   `S3_SECRET_ACCESS_KEY`: Your S3 secret access key.
*   `BUCKET_NAME`: The name of your S3 bucket (e.g., `tdc-photos`).

**Example `.env` file:**
```dotenv
MARKETCHECK_API_KEY=your_marketcheck_api_key_here
GOOGLE_GENERATIVE_AI_API_KEY=your_google_gemini_api_key_here
DB_URL="postgresql://user:password@localhost:5432/your_database_name?schema=public"
S3_ENDPOINT="s3.us-west-001.backblazeb2.com"
S3_ACCESS_KEY_ID=your_s3_access_key_id_here
S3_SECRET_ACCESS_KEY=your_s3_secret_access_key_here
BUCKET_NAME=your-tdc-photos-bucket
```

### Database Setup

1.  **Start PostgreSQL with Docker**:
    ```bash
    docker run --name some-postgres -e POSTGRES_PASSWORD=password -p 5432:5432 -d postgres
    # For the DB_URL in .env, you can use: postgresql://postgres:password@localhost:5432/postgres?schema=public
    ```
    *   *Note*: Adjust username, password, and database name as needed.

2.  **Run Prisma Migrations**:
    This will create the necessary tables in your database.
    ```bash
    bun prisma migrate dev --name init
    ```

### Running the Application

To start the GraphQL server:
```bash
bun run src/index.ts
```
The server will typically run on `http://localhost:3000`. The exact URL will be printed to your console.

## 🧪 Running Tests

To run all unit and integration tests:
```bash
bun test
```

## 🌐 GraphQL API Usage

The GraphQL API is available at `http://localhost:3000/graphql` (or the address shown when the server starts). You can use a tool like GraphQL Playground, Insomnia, or Postman to interact with it.

### Example Mutations

#### 1. `generateUploadUrls`
Request presigned URLs to upload photos to S3.
```graphql
mutation GenerateUploadUrls($filenames: [String!]!) {
  generateUploadUrls(filenames: $filenames) {
    url
  }
}
```
**Variables:**
```json
{
  "filenames": ["car_front.jpg", "car_interior.png", "engine_bay.jpeg"]
}
```
*   The `url` returned is a temporary, secure URL for your client to upload the file directly to S3 using a `PUT` request.
*   The actual `s3Paths` for submission (e.g., `uploads/uuid/car_front.jpg`) are derived from the filenames and a UUID. The client will use these `s3Paths` when calling `createVinSubmission`.

#### 2. `createVinSubmission`
Submit a new VIN for assessment.
```graphql
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
```
**Variables:**
```json
{
  "vin": "1HGCM82633A123456",
  "description": "Well-maintained vehicle, minor scratch on front passenger door.",
  "mileage": 75000,
  "s3Paths": [
    "uploads/ea0c7b91-a1b3-4f5c-8d1e-8a9d0e1f2c3b/car_front.jpg",
    "uploads/ea0c7b91-a1b3-4f5c-8d1e-8a9d0e1f2c3b/car_interior.png"
  ]
}
```
*   The `s3Paths` must correspond to the object keys where your images were uploaded.
*   The `vehicleAssessment` field will be `null` initially as the assessment runs asynchronously in the background.

### Example Queries

#### 1. `getSubmission`
Retrieve a VIN submission by its ID.
```graphql
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
      scoreDescription
      marketValueRange
      tradeInValue
      conditionIssues {
        title
        description
        icon
      }
    }
  }
}
```
**Variables:**
```json
{
  "id": "clt9j1z0y00001w0d9c4x5e6z" # Replace with an actual submission ID
}
```

#### 2. `vehicleAssessment`
Retrieve a vehicle assessment directly by its ID.
```graphql
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
      make
      model
      year
      mileage
      vin
    }
    conditionIssues {
      issueKey
      title
      description
      icon
    }
  }
}
```
**Variables:**
```json
{
  "id": "clt9j1z0y00001w0d9c4x5e6z" # Replace with an actual assessment ID
}
```

## 📐 Project Scope & AI Engineer Decisions

As an AI Engineer tackling this project, my key decisions and areas of focus were:

1.  **AI Engine (`assessment.engine.ts`) Design**:
    *   **Structured AI Interaction**: The `LlmOutputSchema` (Zod) is crucial for ensuring the LLM (Google Gemini) returns a predictable and structured JSON output. This minimizes parsing errors and allows for reliable downstream processing of AI findings.
    *   **Modular Assessment Logic**: The `assessVehicle` function encapsulates all the core intelligence:
        *   **Visual Scoring**: A clear `DEDUCTION_PER_LEVEL` map allows for quantifiable scoring based on AI-identified issues and their severity.
        *   **Market Value Calculation**: A `simpleRegression` and `percentile` analysis is performed on MarketCheck data to derive robust market value ranges and trade-in estimates, adjusting for mileage. This prevents simple averaging and provides a more realistic valuation.
        *   **Reconditioning Cost**: `RECON_COST_PER_LEVEL` provides a basic estimate of repair costs, which directly influences the trade-in value, making the assessment more actionable.
        *   **AI Confidence**: A composite confidence score (`aiConfidence`) is generated, considering both the LLM's confidence in individual findings and the quality/coverage of input photos. This is vital for communicating the reliability of the AI assessment to end-users.

2.  **Asynchronous Processing (`assessment.service.ts`)**:
    *   The `runAssessmentForSubmission` function is designed to be called asynchronously (via `.catch()` in `vin-submission/service.ts`). This is critical because AI inference, S3 downloads, and external API calls can be time-consuming. Keeping the `createVinSubmission` GraphQL mutation responsive is a key product requirement.
    *   Error handling for external services (NHTSA, MarketCheck, S3) is implemented with `catch` blocks, allowing the assessment to attempt to proceed even if one data source fails, or at least log the failure gracefully.

3.  **Data Persistence (`assessment.service.ts`, `graphql.ts`)**:
    *   The `VehicleAssessmentPrismaShape` interface acts as a clear contract between the AI engine and the database persistence layer, ensuring data consistency.
    *   Prisma schemas for `VehicleAssessment`, `VehicleDetails`, and `ConditionIssue` are normalized, allowing for rich querying and clear relationships in the GraphQL API.

4.  **Testability (`__tests__/unit/retry.test.ts`, `__tests__/integration/graphql-workflows.test.ts`)**:
    *   The retry utility is thoroughly unit-tested for various scenarios (success, multiple retries, max retries, custom predicates, backoff).
    *   GraphQL integration tests (`graphql-workflows.test.ts`) validate the API schema and argument handling, ensuring the API surface is robust. External services are mocked to allow for fast and reliable integration testing.

5.  **S3 Integration (`lib/s3.ts`, `vin-submission/service.ts`)**:
    *   Using presigned URLs for uploads delegates the actual file transfer directly to S3, reducing load on the backend server and enhancing security.
    *   Image fetching from S3 during assessment includes basic media type detection based on file extension.

## ☁️ Deployment

This backend service is designed for cloud deployment. For [Fly.io](https://fly.io/), you would typically:
1.  **Deploy to fly**: Run `fly deploy` to deply
2.  **Configure Environment Variables**: Set the necessary environment variables (API keys, DB_URL, S3 credentials) on the hosting platform.
3.  **Database**: Point `DB_URL` to a provisioned PostgreSQL database (e.g., Fly.io's built-in Postgres offering or an external managed service).
4.  **S3-compatible Storage**: Configure an S3-compatible bucket (e.g., Backblaze B2, AWS S3) and link credentials via environment variables.

## 📈 Future Improvements / Further Work

To enhance this project, several areas could be explored across both the backend and frontend:

### Backend Improvements

1.  **Robust Asynchronous Workflow**: Integrate a dedicated message queue (e.g., BullMQ, as hinted in the test description) to manage the vehicle assessment tasks. This would provide:
    *   **Guaranteed Delivery**: Ensuring assessments are retried on transient failures.
    *   **Scalability**: Allowing multiple workers to process assessments concurrently.
    *   **Visibility**: Better tracking of job status (pending, processing, completed, failed).
2.  **Image Processing Pipeline**:
    *   **Validation**: More robust validation of image files (size, format) during presigned URL generation.
    *   **Optimization**: Automatic resizing or compression of images before sending to the AI model to reduce inference cost and improve performance.
    *   **Watermarking/Metadata**: Adding metadata or watermarks to uploaded images.
3.  **Enhanced AI Feedback Loop**: Implement mechanisms to collect feedback on AI assessment accuracy, allowing for continuous improvement of the LLM prompts and post-processing logic.
4.  **User Authentication & Authorization**: Secure the GraphQL API with authentication (e.g., JWT, OAuth, or Cognito as mentioned in the general advice) and fine-grained authorization rules.
5.  **S3 Path Security**: Implement a more robust validation for `s3Paths` in `createVinSubmission` to ensure that submitted paths were indeed generated by `generateUploadUrls` and belong to the current user/session.
6.  **Comprehensive Error States**: Add more detailed status updates for `VinSubmission` (e.g., `PENDING`, `NHTSA_FAILED`, `MARKET_FAILED`, `AI_FAILED`, `COMPLETED`) to provide better transparency into the assessment process.

### Frontend Improvements

1.  **Real-time Updates**: Implement GraphQL Subscriptions or WebSockets to notify clients when a vehicle assessment is completed or updated, instead of relying on polling (`refetchInterval: 5000` in `useSubmission`). This would provide a smoother and more efficient user experience.
2.  **User Feedback & Notifications**:
    *   Implement toast notifications or modals for successful submissions, upload errors, or assessment failures.
    *   Add validation feedback for input fields (VIN format, mileage range).
3.  **Accessibility (A11y) Enhancements**: Conduct a thorough accessibility audit and implement improvements, especially for forms, dynamic content updates, and navigation. (Storybook's a11y addon is a good start, but deeper integration is possible).
4.  **Administrative Interface**: While a full separate admin portal might be a larger project, key admin functionalities could be integrated, such as:
    *   A list view of all submissions with their current status.
    *   The ability to view raw AI findings or trigger a re-assessment.
    *   A mechanism for an administrator to correct or override assessment results.
5.  **Progress Indicators and Loading States**: Refine existing loading states and add more granular progress indicators for various steps of the submission and assessment process, particularly during photo uploads and backend processing.
6.  **Deep Linking & Sharing**: Allow users to share direct links to completed appraisal reports.
7.  **Styling Consistency**: Leverage Storybook further to ensure all components adhere to a consistent design system and can be easily extended. Consider integrating a UI library for more complex components if needed.