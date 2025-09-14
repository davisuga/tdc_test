import SchemaBuilder from "@pothos/core";
import { PrismaClient } from "./generated/prisma/client";
import PrismaPlugin from "@pothos/plugin-prisma";
// This is the default location for the generator, but this can be
// customized as described above.
// Using a type only import will help avoid issues with undeclared
// exports in esm mode
// import type PrismaTypes from "./pothos-types";

const prisma = new PrismaClient({});

// Mock S3Client for now since bun package is not available
const s3Client = {
  presign: (path: string, options: any) => {
    return `https://example.com/presigned/${path}?expires=${Date.now() + options.expiresIn * 1000}`;
  }
};


export const builder = new SchemaBuilder<{
  // PrismaTypes: PrismaTypes;
}>({
  plugins: [PrismaPlugin],
  prisma: {
    client: prisma,
    // defaults to false, uses /// comments from prisma schema as descriptions
    // for object types, relations and exposed fields.
    // descriptions can be omitted by setting description to false
    exposeDescriptions: true,
    // use where clause from prismaRelatedConnection for totalCount (defaults to true)
    filterConnectionTotalCount: true,
    // warn when not using a query parameter correctly
    onUnusedQuery: process.env.NODE_ENV === "production" ? null : "warn",
  },
});

// Add DateTime scalar
builder.scalarType("DateTime", {
  serialize: (date: Date) => date.toISOString(),
  parseValue: (value: string) => new Date(value),
});
builder.prismaObject("VehicleAssessment", {
  name: "VehicleAssessment",
  fields: (t) => ({
    id: t.exposeID("id"),
    vehicleDetails: t.relation("vehicleDetails"),
    conditionIssues: t.relation("conditionIssues"),
    marketValueRange: t.exposeString("marketValueRange"),
    tradeInValue: t.exposeString("tradeInValue"),
    tradeInDescription: t.exposeString("tradeInDescription"),
    aiConfidence: t.exposeInt("aiConfidence"),
    aiConfidenceDescription: t.exposeString("aiConfidenceDescription"),
  }),
});
builder.prismaObject("VehicleDetails", {
  name: "VehicleDetails",
  fields: (t) => ({
    id: t.exposeID("id"),
    vin: t.exposeString("vin"),
    make: t.exposeString("make"),
    model: t.exposeString("model"),
    year: t.exposeInt("year"),

    vehicleAssessment: t.relation("VehicleAssessment"),
  }),
});

builder.prismaObject("ConditionIssue", {
  name: "ConditionIssue",
  fields: (t) => ({
    id: t.exposeID("id"),
    issueKey: t.exposeString("issueKey"),
    title: t.exposeString("title"),
    description: t.exposeString("description"),
    icon: t.exposeString("icon"),
    vehicleAssessment: t.relation("vehicleAssessment"),
  }),
});

builder.prismaObject("VinSubmission", {
  name: "VinSubmission",
  fields: (t) => ({
    id: t.exposeID("id"),
    vin: t.exposeString("vin"),
    description: t.exposeString("description", { nullable: true }),
    mileage: t.exposeInt("mileage", { nullable: true }),
    s3Paths: t.exposeStringList("s3Paths"),
    createdAt: t.expose("createdAt", { type: "DateTime" }),
    updatedAt: t.expose("updatedAt", { type: "DateTime" }),
  }),
});

builder.queryType({
  fields: (t) => ({
    vehicleAssessment: t.prismaField({
      type: "VehicleAssessment",
      args: {
        id: t.arg.id({ required: true }),
      },
      resolve: async (query, root, args, context, info) => {
        return prisma.vehicleAssessment.findUnique({
          where: { id: args.id },
          ...query,
        });
      },
    }),
  }),
});
const SignedUrl = builder.objectRef<{ url: string }>("SignedUrl");
SignedUrl.implement({
  fields: (t) => ({
    url: t.exposeString("url"),
  }),
});

builder.mutationType({
  fields: (t) => ({
    generateUploadUrls: t.field({
      type: [SignedUrl],
      args: {
        filenames: t.arg.stringList({ required: true }),
      },
      resolve: async (root, args, context, info) => {
        const { filenames } = args;
        if (
          !Array.isArray(filenames) ||
          filenames.length < 1 ||
          filenames.length > 10
        ) {
          throw new Error("filenames must be an array of 1-10 items");
        }
        const urls: string[] = filenames.map((filename) => {
          // Extract extension (including dot)


          const randomPath = `uploads/${crypto.randomUUID()}/${filename}`;
          console.log("Generating presigned URL for", randomPath);
          return s3Client.presign(randomPath, {
            method: "PUT",
            expiresIn: 3600, // 1 hour
          });
        });
        return urls.map((url) => ({ url }));
      },
    }),
    createVinSubmission: t.prismaField({
      type: "VinSubmission",
      args: {
        vin: t.arg.string({ required: true }),
        description: t.arg.string({ required: false }),
        mileage: t.arg.int({ required: false }),
        s3Paths: t.arg.stringList({ required: true }),
      },
      resolve: async (query, root, args, context, info) => {
        const { vin, description, mileage, s3Paths } = args;
        
        // Validate VIN format (basic validation)
        if (!vin || vin.trim().length === 0) {
          throw new Error("VIN is required");
        }
        
        // Validate s3Paths
        if (!Array.isArray(s3Paths)) {
          throw new Error("s3Paths must be an array");
        }
        
        return prisma.vinSubmission.create({
          ...query,
          data: {
            vin: vin.trim(),
            description: description?.trim() || null,
            mileage: mileage || null,
            s3Paths,
          },
        });
      },
    }),
  }),
});
