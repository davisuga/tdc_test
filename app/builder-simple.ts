import SchemaBuilder from "@pothos/core";
// import { PrismaClient } from "@prisma/client";
import { S3Client } from "bun";

// const prisma = new PrismaClient({});

const s3Client = new S3Client({
  bucket: "tdc-photos",
  endpoint: process.env.S3_ENDPOINT || "s3.us-west-001.backblazeb2.com"// Backblaze B2 default
  // Credentials read from env: S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY
});

export const builder = new SchemaBuilder({
  plugins: [],
});

// DateTime scalar - commented out for now
// builder.scalarType("DateTime", {
//   serialize: (date: Date) => date.toISOString(),
//   parseValue: (value: string) => new Date(value),
// });

// SignedUrl type
const SignedUrl = builder.objectRef<{ url: string }>("SignedUrl");
SignedUrl.implement({
  fields: (t) => ({
    url: t.exposeString("url"),
  }),
});

// VinSubmission type
const VinSubmission = builder.objectRef<{
  id: string;
  vin: string;
  description?: string | null;
  s3Paths: string[];
  createdAt: Date;
  updatedAt: Date;
}>("VinSubmission");

VinSubmission.implement({
  fields: (t) => ({
    id: t.exposeID("id"),
    vin: t.exposeString("vin"),
    description: t.exposeString("description", { nullable: true }),
    s3Paths: t.exposeStringList("s3Paths"),
    createdAt: t.field({
      type: "String",
      resolve: (parent) => parent.createdAt.toISOString(),
    }),
    updatedAt: t.field({
      type: "String", 
      resolve: (parent) => parent.updatedAt.toISOString(),
    }),
  }),
});

// Query type
builder.queryType({
  fields: (t) => ({
    hello: t.string({
      resolve: () => "Hello World!",
    }),
  }),
});

// Mutation type
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
    createVinSubmission: t.field({
      type: VinSubmission,
      args: {
        vin: t.arg.string({ required: true }),
        description: t.arg.string({ required: false }),
        s3Paths: t.arg.stringList({ required: true }),
      },
      resolve: async (root, args, context, info) => {
        const { vin, description, s3Paths } = args;
        
        // Validate VIN format (basic validation)
        if (!vin || vin.trim().length === 0) {
          throw new Error("VIN is required");
        }
        
        // Validate s3Paths
        if (!Array.isArray(s3Paths)) {
          throw new Error("s3Paths must be an array");
        }
        
        try {
          // Mock the database call for now
          const mockResult = {
            id: `mock-${Date.now()}`,
            vin: vin.trim(),
            description: description?.trim() || null,
            s3Paths,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          
          console.log("VIN submission data (would be saved to DB):", mockResult);
          
          return mockResult;
        } catch (error) {
          console.error("Failed to create VIN submission:", error);
          throw new Error("Failed to save VIN submission");
        }
      },
    }),
  }),
});