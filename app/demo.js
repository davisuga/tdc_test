#!/usr/bin/env node

// Demo script to showcase the complete TDC backend functionality
// This script demonstrates:
// 1. Vehicle management
// 2. Photo upload URL generation  
// 3. File upload simulation
// 4. Database interactions

const GRAPHQL_ENDPOINT = 'http://localhost:4000/graphql';

async function graphqlQuery(query, variables = {}) {
  const response = await fetch(GRAPHQL_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query, variables }),
  });
  
  const result = await response.json();
  if (result.errors) {
    console.error('GraphQL Error:', result.errors);
    throw new Error(result.errors[0].message);
  }
  
  return result.data;
}

async function demo() {
  console.log('🚀 Starting TDC Backend Demo...\n');

  try {
    // 1. Test basic connectivity
    console.log('1. Testing server connectivity...');
    const hello = await graphqlQuery('{ hello serverStatus }');
    console.log('✅ Server Response:', hello.hello);
    console.log('📊 Server Status:', hello.serverStatus);
    console.log('');

    // 2. List existing vehicles
    console.log('2. Fetching existing vehicles...');
    const vehiclesQuery = `{
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
    }`;
    const vehiclesData = await graphqlQuery(vehiclesQuery);
    console.log('🚗 Existing vehicles:', vehiclesData.vehicles.length);
    vehiclesData.vehicles.forEach(vehicle => {
      console.log(`   - ${vehicle.year} ${vehicle.make} ${vehicle.model} (${vehicle.vin})`);
      console.log(`     Photos: ${vehicle.photos.length}`);
    });
    console.log('');

    // 3. Create a new vehicle
    console.log('3. Creating a new vehicle...');
    const createVehicleMutation = `
      mutation {
        createVehicle(
          make: "Tesla"
          model: "Model S"
          year: 2023
          vin: "DEMO123456789"
        ) {
          id
          make
          model
          year
          vin
        }
      }
    `;
    const newVehicle = await graphqlQuery(createVehicleMutation);
    console.log('✅ Created vehicle:', newVehicle.createVehicle);
    const vehicleId = newVehicle.createVehicle.id;
    console.log('');

    // 4. Generate upload URL for photo
    console.log('4. Generating upload URL for vehicle photo...');
    const uploadUrlMutation = `
      mutation {
        generateUploadUrl(vehicleId: "${vehicleId}", fileType: "image/jpeg") {
          uploadUrl
          photoId
          filename
        }
      }
    `;
    const uploadData = await graphqlQuery(uploadUrlMutation);
    console.log('✅ Upload URL generated successfully');
    console.log('📸 Photo ID:', uploadData.generateUploadUrl.photoId);
    console.log('📁 Filename:', uploadData.generateUploadUrl.filename);
    console.log('🔗 Upload URL:', uploadData.generateUploadUrl.uploadUrl.substring(0, 80) + '...');
    console.log('');

    // 5. Simulate file upload
    console.log('5. Simulating file upload...');
    const uploadUrl = uploadData.generateUploadUrl.uploadUrl;
    const photoId = uploadData.generateUploadUrl.photoId;
    
    // Create a dummy image file content (in real scenario, this would be actual file data)
    const dummyImageContent = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');
    
    const uploadResponse = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'image/jpeg',
      },
      body: dummyImageContent,
    });

    if (uploadResponse.ok) {
      console.log('✅ File uploaded successfully to MinIO/S3');
      
      // 6. Mark photo as uploaded
      console.log('6. Marking photo as uploaded in database...');
      const markUploadedMutation = `
        mutation {
          markPhotoUploaded(photoId: "${photoId}") {
            id
            uploaded
            filename
            createdAt
          }
        }
      `;
      const uploadedPhoto = await graphqlQuery(markUploadedMutation);
      console.log('✅ Photo marked as uploaded:', uploadedPhoto.markPhotoUploaded);
    } else {
      console.log('❌ File upload failed:', uploadResponse.status, uploadResponse.statusText);
    }
    console.log('');

    // 7. Verify the vehicle now has the photo
    console.log('7. Verifying vehicle now has the photo...');
    const vehicleWithPhotos = await graphqlQuery(`{
      vehicle(id: "${vehicleId}") {
        id
        make
        model
        photos {
          id
          filename
          uploaded
          createdAt
        }
      }
    }`);
    console.log('✅ Vehicle with photos:', vehicleWithPhotos.vehicle);
    console.log('');

    // 8. Test photo upload for existing vehicle
    console.log('8. Testing photo upload for existing vehicle...');
    const existingVehicleId = vehiclesData.vehicles[0]?.id;
    if (existingVehicleId) {
      const existingUploadMutation = `
        mutation {
          generateUploadUrl(vehicleId: "${existingVehicleId}", fileType: "image/png") {
            uploadUrl
            photoId
            filename
          }
        }
      `;
      const existingUpload = await graphqlQuery(existingUploadMutation);
      console.log('✅ Upload URL generated for existing vehicle');
      console.log('📸 Photo ID:', existingUpload.generateUploadUrl.photoId);
      console.log('📁 Filename:', existingUpload.generateUploadUrl.filename);
    }
    console.log('');

    // 9. Final summary
    console.log('9. Final summary...');
    const finalVehicles = await graphqlQuery(vehiclesQuery);
    console.log('🏁 Demo completed successfully!');
    console.log(`📊 Total vehicles in system: ${finalVehicles.vehicles.length}`);
    
    const totalPhotos = finalVehicles.vehicles.reduce((sum, v) => sum + v.photos.length, 0);
    console.log(`📸 Total photos in system: ${totalPhotos}`);
    
    const uploadedPhotos = finalVehicles.vehicles.reduce((sum, v) => 
      sum + v.photos.filter(p => p.uploaded).length, 0);
    console.log(`✅ Successfully uploaded photos: ${uploadedPhotos}`);

  } catch (error) {
    console.error('❌ Demo failed:', error.message);
    process.exit(1);
  }
}

// Run the demo
demo();