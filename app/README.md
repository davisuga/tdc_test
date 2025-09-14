# app

To install dependencies:

```bash
bun install
```

To run:

```bash
bun run index.ts
```

## Environment Variables

Create a `.env` file in the app directory with the following variables:

```env
# MarketCheck API Key for fetching vehicle market data
MARKETCHECK_API_KEY=your_marketcheck_api_key_here

# Google Generative AI API Key for Gemini vehicle assessment
GOOGLE_GENERATIVE_AI_API_KEY=your_google_ai_api_key_here

# S3 Configuration (Backblaze B2)
S3_ENDPOINT=s3.us-west-001.backblazeb2.com
S3_ACCESS_KEY_ID=your_s3_access_key_here
S3_SECRET_ACCESS_KEY=your_s3_secret_key_here
```

## Vehicle Assessment Agent

The app now includes an AI-powered vehicle assessment agent that:

1. **Analyzes vehicle photos** using Google's Gemini AI model
2. **Fetches vehicle data** from NHTSA's VIN decode API
3. **Gets market data** from MarketCheck API
4. **Generates assessments** including:
   - Visual condition score (0-100)
   - Condition issues with severity ratings
   - Market value range and trade-in estimates
   - AI confidence levels

The assessment runs **asynchronously in the background** when a `VinSubmission` is created via the `createVinSubmission` mutation.

This project was created using `bun init` in bun v1.2.21. [Bun](https://bun.com) is a fast all-in-one JavaScript runtime.
