import { describe, test, expect } from 'vitest';

const GRAPHQL_ENDPOINT = 'http://localhost:4000/graphql';

describe('File Upload Integration Tests', () => {
  test('should upload a file using pre-signed URL', async () => {
    // First, get a pre-signed upload URL
    const mutation = {
      query: `mutation {
        generateUploadUrl(vehicleId: "vehicle_1", fileType: "text/plain") {
          uploadUrl
          photoId
          filename
        }
      }`,
    };

    const response = await fetch(GRAPHQL_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(mutation),
    });

    const result = await response.json();
    expect(response.status).toBe(200);
    expect(result.data.generateUploadUrl.uploadUrl).toBeDefined();

    const uploadUrl = result.data.generateUploadUrl.uploadUrl;

    // Now try to upload a test file using the pre-signed URL
    const testContent = 'This is a test file content for vehicle photo upload';
    
    const uploadResponse = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'text/plain',
      },
      body: testContent,
    });

    expect(uploadResponse.status).toBe(200);
    console.log('✅ File upload test successful!');
  });

  test('should generate unique URLs for different requests', async () => {
    const mutation = {
      query: `mutation {
        generateUploadUrl(vehicleId: "vehicle_1", fileType: "image/jpeg") {
          uploadUrl
          photoId
        }
      }`,
    };

    // Make two requests
    const [response1, response2] = await Promise.all([
      fetch(GRAPHQL_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mutation),
      }),
      fetch(GRAPHQL_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mutation),
      }),
    ]);

    const result1 = await response1.json();
    const result2 = await response2.json();

    expect(result1.data.generateUploadUrl.uploadUrl).not.toBe(result2.data.generateUploadUrl.uploadUrl);
    expect(result1.data.generateUploadUrl.photoId).not.toBe(result2.data.generateUploadUrl.photoId);
    console.log('✅ Unique URL generation test successful!');
  });
});