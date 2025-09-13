import { describe, test, expect, beforeAll } from 'vitest';

const GRAPHQL_ENDPOINT = 'http://localhost:4000/graphql';

describe('GraphQL Server E2E Tests', () => {
  beforeAll(async () => {
    // Wait for server to be ready
    await new Promise(resolve => setTimeout(resolve, 2000));
  });

  test('should respond to hello query', async () => {
    const query = {
      query: '{ hello }',
    };

    const response = await fetch(GRAPHQL_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(query),
    });

    const result = await response.json();
    
    expect(response.status).toBe(200);
    expect(result.data.hello).toBe('Hello, World! GraphQL server is running.');
  });

  test('should respond to serverStatus query', async () => {
    const query = {
      query: '{ serverStatus }',
    };

    const response = await fetch(GRAPHQL_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(query),
    });

    const result = await response.json();
    
    expect(response.status).toBe(200);
    expect(result.data.serverStatus).toContain('Server is running at');
  });

  test('should fetch vehicles from database', async () => {
    const query = {
      query: `{
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
      }`,
    };

    const response = await fetch(GRAPHQL_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(query),
    });

    const result = await response.json();
    
    expect(response.status).toBe(200);
    expect(result.data.vehicles).toBeInstanceOf(Array);
    expect(result.data.vehicles.length).toBeGreaterThan(0);
    expect(result.data.vehicles[0]).toHaveProperty('make');
    expect(result.data.vehicles[0]).toHaveProperty('model');
    expect(result.data.vehicles[0]).toHaveProperty('vin');
  });

  test('should generate upload URL and create photo record', async () => {
    const mutation = {
      query: `mutation {
        generateUploadUrl(vehicleId: "vehicle_1", fileType: "image/jpeg") {
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
    expect(result.data.generateUploadUrl.uploadUrl).toContain('localhost:9000/tdc-photos/vehicles/vehicle_1');
    expect(result.data.generateUploadUrl.photoId).toMatch(/^photo_/);
    expect(result.data.generateUploadUrl.filename).toMatch(/^\d+\.jpeg$/);
  });

  test('should create a new vehicle', async () => {
    const mutation = {
      query: `mutation {
        createVehicle(
          make: "Ford"
          model: "F-150"
          year: 2021
          vin: "TESTVIN123456"
        ) {
          id
          make
          model
          year
          vin
          photos {
            id
          }
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
    expect(result.data.createVehicle.make).toBe('Ford');
    expect(result.data.createVehicle.model).toBe('F-150');
    expect(result.data.createVehicle.year).toBe(2021);
    expect(result.data.createVehicle.vin).toBe('TESTVIN123456');
    expect(result.data.createVehicle.photos).toEqual([]);
  });

  test('should mark photo as uploaded', async () => {
    // First create a photo
    const createPhotoMutation = {
      query: `mutation {
        generateUploadUrl(vehicleId: "vehicle_1", fileType: "image/png") {
          photoId
        }
      }`,
    };

    const createResponse = await fetch(GRAPHQL_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(createPhotoMutation),
    });

    const createResult = await createResponse.json();
    const photoId = createResult.data.generateUploadUrl.photoId;

    // Then mark it as uploaded
    const markUploadedMutation = {
      query: `mutation {
        markPhotoUploaded(photoId: "${photoId}") {
          id
          uploaded
          filename
        }
      }`,
    };

    const response = await fetch(GRAPHQL_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(markUploadedMutation),
    });

    const result = await response.json();
    
    expect(response.status).toBe(200);
    expect(result.data.markPhotoUploaded.uploaded).toBe(true);
    expect(result.data.markPhotoUploaded.id).toBe(photoId);
  });

  test('should handle errors for non-existent vehicle', async () => {
    const mutation = {
      query: `mutation {
        generateUploadUrl(vehicleId: "non-existent-vehicle", fileType: "image/jpeg") {
          uploadUrl
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
    expect(result.errors).toBeDefined();
    expect(result.errors[0].message).toContain('not found');
  });

  test('should test ping mutation', async () => {
    const mutation = {
      query: 'mutation { ping }',
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
    expect(result.data.ping).toBe('pong');
  });
});