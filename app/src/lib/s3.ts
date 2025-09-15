import { S3Client } from "bun";

export const UPLOADS_BUCKET_NAME = process.env.BUCKET_NAME || "tdc-photos";

export const s3Client = new S3Client({
  bucket: UPLOADS_BUCKET_NAME,
  endpoint: process.env.S3_ENDPOINT || "s3.us-west-001.backblazeb2.com",
});