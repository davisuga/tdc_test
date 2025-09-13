# TDC Backend - GraphQL API

This is the backend GraphQL API for the TDC (Trade Data Corporation) vehicle appraisal system. It provides functionality for managing vehicles, photos, and appraisals with secure file upload capabilities.

## Features

- 🚀 GraphQL API with Pothos Schema Builder
- 📸 Pre-signed S3 URL generation for secure file uploads
- 🐘 PostgreSQL database support (configured with Docker)
- 🗄️ Redis for background job processing with BullMQ
- 📦 MinIO for local S3-compatible object storage
- 🔧 TypeScript for type safety
- 🧪 Comprehensive test suite with Vitest

## Quick Start

### Prerequisites

- Node.js 18+
- Docker and Docker Compose

### 1. Install Dependencies

```bash
cd app
npm install
```

### 2. Start Services

Start the required services (PostgreSQL, Redis, MinIO):

```bash
# From the project root
docker compose up -d
```

### 3. Start Development Server

```bash
cd app
npm run dev
```

The GraphQL server will be available at:
- **GraphQL Endpoint**: http://localhost:4000/graphql
- **GraphiQL Interface**: http://localhost:4000/graphql

### 4. Run Tests

```bash
cd app
npm test
```

## GraphQL Schema

### Queries

#### `hello: String`
A simple hello world query to verify the server is running.

```graphql
query {
  hello
}
```

#### `vehicles: [Vehicle!]!`
Get all vehicles in the system.

```graphql
query {
  vehicles {
    id
    make
    model
    year
    vin
    photos {
      id
      filename
      uploaded
    }
  }
}
```

#### `vehicle(id: String!): Vehicle`
Get a specific vehicle by ID.

```graphql
query {
  vehicle(id: "vehicle_1") {
    id
    make
    model
    year
    vin
  }
}
```

### Mutations

#### `generateUploadUrl(vehicleId: String!, fileType: String!): UploadUrlResponse!`
Generate a pre-signed S3 upload URL for a vehicle photo.

```graphql
mutation {
  generateUploadUrl(vehicleId: "vehicle_1", fileType: "image/jpeg") {
    uploadUrl
    photoId
    filename
  }
}
```

#### `createVehicle(...): Vehicle!`
Create a new vehicle.

```graphql
mutation {
  createVehicle(
    make: "Toyota"
    model: "Camry"
    year: 2020
    vin: "1234567890"
  ) {
    id
    make
    model
    year
    vin
  }
}
```

#### `markPhotoUploaded(photoId: String!): Photo!`
Mark a photo as successfully uploaded.

```graphql
mutation {
  markPhotoUploaded(photoId: "photo_123") {
    id
    uploaded
    filename
  }
}
```

## Environment Variables

Copy `.env` and configure as needed:

```bash
# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/tdc_db"

# Redis
REDIS_URL="redis://localhost:6379"

# S3/MinIO Configuration
AWS_ACCESS_KEY_ID="minioadmin"
AWS_SECRET_ACCESS_KEY="minioadmin"
AWS_REGION="us-east-1"
AWS_ENDPOINT_URL="http://localhost:9000"
S3_BUCKET_NAME="tdc-photos"

# Server
PORT=4000
```

## Services Overview

### MinIO (Local S3)
- **Console**: http://localhost:9001
- **API**: http://localhost:9000
- **Credentials**: minioadmin / minioadmin

### PostgreSQL
- **Host**: localhost:5432
- **Database**: tdc_db
- **User**: postgres / password

### Redis
- **Host**: localhost:6379

## File Upload Flow

1. Client requests upload URL via `generateUploadUrl` mutation
2. Server generates pre-signed S3 URL and creates photo record in database
3. Client uploads file directly to S3 using the pre-signed URL
4. Client calls `markPhotoUploaded` to update the photo status

## Testing

The project includes comprehensive E2E tests:

- Basic GraphQL queries and mutations
- File upload functionality
- Error handling
- Database operations

Run tests with:

```bash
npm test
```

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │───▶│  GraphQL API    │───▶│   PostgreSQL    │
│   (React)       │    │   (Node.js)     │    │   (Database)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌─────────────────┐    ┌─────────────────┐
                       │     Redis       │    │     MinIO       │
                       │ (Background     │    │  (File Storage) │
                       │     Jobs)       │    │                 │
                       └─────────────────┘    └─────────────────┘
```

## Development Commands

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm test

# Build for production
npm run build

# Start production server
npm start

# Database operations (when Prisma is fully configured)
npm run db:generate
npm run db:push
npm run db:migrate
```

## Tech Stack

- **GraphQL Server**: GraphQL Yoga
- **Schema Builder**: Pothos GraphQL
- **Database**: PostgreSQL with Prisma ORM
- **File Storage**: AWS S3 / MinIO
- **Background Jobs**: BullMQ + Redis
- **Testing**: Vitest
- **Language**: TypeScript
- **Runtime**: Node.js