// src/graphql/schema.ts
import { builder } from "./builder";

// Import feature modules to register their types, queries, and mutations
import "../features/vin-submission/graphql";
import "../features/vehicle-assessment/graphql";


export const schema = builder.toSchema();