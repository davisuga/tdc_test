import { describe, test, expect, beforeAll } from 'vitest';

const GRAPHQL_ENDPOINT = 'http://localhost:4000/graphql';

describe('GraphQL Server E2E Tests', () => {
  let testVehicleId: string;

  beforeAll(async () => {
    // Wait for server to be ready
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Get a test vehicle ID from the database
    const vehiclesQuery = {
      query: '{ vehicles { id make model year vin } }',
    };

    const response = await fetch(GRAPHQL_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(vehiclesQuery),
    });

    const result = await response.json();
    if (result.data?.vehicles && result.data.vehicles.length > 0) {
      testVehicleId = result.data.vehicles[0].id;
    } else {
      throw new Error('No test vehicles found in database');
    }
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
          mileage
          condition
          createdAt
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
    expect(result.data.vehicles[0]).toHaveProperty('createdAt');
  });

  test('should generate upload URL and create photo record', async () => {
    const mutation = {
      query: `mutation {
        generateUploadUrl(vehicleId: "${testVehicleId}", fileType: "image/jpeg") {
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
    expect(result.data.generateUploadUrl.uploadUrl).toContain(`vehicles/${testVehicleId}`);
    expect(result.data.generateUploadUrl.photoId).toBeTruthy();
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
          mileage: 25000
          condition: "Good"
        ) {
          id
          make
          model
          year
          vin
          mileage
          condition
          createdAt
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
    expect(result.data.createVehicle.mileage).toBe(25000);
    expect(result.data.createVehicle.condition).toBe('Good');
    expect(result.data.createVehicle.photos).toEqual([]);
    expect(result.data.createVehicle.createdAt).toBeTruthy();
  });

  test('should mark photo as uploaded', async () => {
    // First create a photo
    const createPhotoMutation = {
      query: `mutation {
        generateUploadUrl(vehicleId: "${testVehicleId}", fileType: "image/png") {
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
          url
          createdAt
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
    expect(result.data.markPhotoUploaded.createdAt).toBeTruthy();
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

  test('should fetch individual vehicle by ID', async () => {
    const query = {
      query: `{
        vehicle(id: "${testVehicleId}") {
          id
          make
          model
          year
          vin
          mileage
          condition
          createdAt
          photos {
            id
            filename
            uploaded
            url
            createdAt
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
    expect(result.data.vehicle.id).toBe(testVehicleId);
    expect(result.data.vehicle).toHaveProperty('make');
    expect(result.data.vehicle).toHaveProperty('model');
    expect(result.data.vehicle).toHaveProperty('vin');
    expect(result.data.vehicle).toHaveProperty('photos');
  });

  test('should fetch all photos', async () => {
    const query = {
      query: `{
        photos {
          id
          vehicleId
          filename
          url
          uploaded
          createdAt
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
    expect(result.data.photos).toBeInstanceOf(Array);
    // We may have photos from previous tests
  });
});