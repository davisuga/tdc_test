# 🚗 AI-Assisted Vehicle Appraisal System

## 🌟 Project Overview

The core purpose of this system is to provide a platform where users can submit vehicle information (VIN, mileage, notes) and photos. The backend then performs an automated assessment using various data points and an AI model, generating a comprehensive appraisal report. The frontend provides an intuitive interface for users to submit vehicles and view these detailed reports.

This project was developed with a focus on the **AI Engineer** role and a **Product Engineering** perspective for both backend and frontend, emphasizing functional capabilities, structured data, and a good developer experience.

## 📐 Architecture

The system is structured as a monorepo with distinct backend and frontend applications:

*   **`backend/`**: Contains the GraphQL API service.
*   **`frontend/`**: Contains the React single-page application.

Each directory has its own `README.md` with detailed information on its specific features, tech stack, and setup instructions.

## 💻 Overall Tech Stack Highlights

*   **Runtime**: Bun
*   **Database**: PostgreSQL (via Prisma ORM)
*   **Backend**: graphql-yoga, Pothos GraphQL, @ai-sdk/google (for Gemini AI), S3-compatible storage
*   **Frontend**: React, Vite, React Router, Tailwind CSS, Zeus GraphQL Client
*   **Testing**: Bun.test (Vitest compatible), Storybook

## 🌟 My Chosen Role: AI Engineer (with a Product Engineering Perspective)

As an **AI Engineer**, my primary focus for this project was on building the intelligence layer that performs the vehicle assessment. This involved:
*   Integrating with a Large Language Model (LLM) for visual inspection analysis.
*   Designing robust input and output schemas for AI interactions.
*   Developing the logic to transform raw AI observations and external data into a comprehensive vehicle assessment, including scoring, market value estimates, and condition issues.
*   Ensuring the assessment process is as automated and accurate as possible.

From a **Product Engineering perspective**, I also focused on making this AI capability consumable via a well-defined GraphQL API and ensuring the overall user workflow (submission -> assessment) is clear, asynchronous, and reliable.

## 🚀 Project Definition: Automated Vehicle Assessment API

The goal of this project is to provide a core API for a service that allows users (e.g., dealerships, private sellers) to submit a vehicle's VIN, description, mileage, and photos. The system then automatically:
1.  Decodes the VIN using NHTSA data.
2.  Fetches comparable market data using MarketCheck.
3.  Utilizes an AI model (Google Gemini) to visually inspect the uploaded photos for condition issues.
4.  Generates a comprehensive assessment including a visual score, detailed condition issues, market value range, and trade-in value estimate.

The API handles the initial submission and provides endpoints to retrieve the assessment results once processed.

## 🚀 Getting Started (Full System)

To run the entire application locally, you'll need to set up both the backend and the frontend components.

Read the README of each folder for more instructions.