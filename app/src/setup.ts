import { CreateBucketCommand, HeadBucketCommand } from '@aws-sdk/client-s3';
import { s3Client, bucketName, generateUploadUrl } from './s3.js';

export async function initializeS3() {
  try {
    // Check if bucket exists
    await s3Client.send(new HeadBucketCommand({ Bucket: bucketName }));
    console.log(`✅ S3 bucket '${bucketName}' already exists`);
  } catch (error: any) {
    if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
      try {
        // Create bucket if it doesn't exist
        await s3Client.send(new CreateBucketCommand({ Bucket: bucketName }));
        console.log(`✅ Created S3 bucket '${bucketName}'`);
      } catch (createError) {
        console.error('❌ Failed to create S3 bucket:', createError);
        throw createError;
      }
    } else {
      console.error('❌ Error checking S3 bucket:', error);
      throw error;
    }
  }
}

export async function testS3Upload() {
  try {
    // Test generating upload URL
    const testKey = `test-${Date.now()}.jpg`;
    const uploadUrl = await generateUploadUrl(testKey, 'image/jpeg');
    console.log(`✅ Generated upload URL for key: ${testKey}`);
    console.log(`📝 Upload URL: ${uploadUrl.substring(0, 100)}...`);
    return { success: true, uploadUrl, key: testKey };
  } catch (error) {
    console.error('❌ Failed to generate upload URL:', error);
    return { success: false, error };
  }
}