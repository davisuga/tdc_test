import { builder } from './builder.js';
import { generateUploadUrl } from './s3.js';
import { Database, Vehicle, Photo } from './database.js';

// Vehicle GraphQL Type
const VehicleType = builder.objectRef<Vehicle>('Vehicle');
builder.objectType(VehicleType, {
  description: 'A vehicle for appraisal',
  fields: (t) => ({
    id: t.exposeString('id'),
    make: t.exposeString('make'),
    model: t.exposeString('model'),
    year: t.exposeInt('year'),
    vin: t.exposeString('vin'),
    photos: t.field({
      type: [PhotoType],
      resolve: (vehicle) => vehicle.photos,
    }),
  }),
});

// Photo GraphQL Type
const PhotoType = builder.objectRef<Photo>('Photo');
builder.objectType(PhotoType, {
  description: 'A photo of a vehicle',
  fields: (t) => ({
    id: t.exposeString('id'),
    vehicleId: t.exposeString('vehicleId'),
    filename: t.exposeString('filename'),
    uploadUrl: t.exposeString('uploadUrl'),
    uploaded: t.exposeBoolean('uploaded'),
    createdAt: t.field({
      type: 'String',
      resolve: (photo) => photo.createdAt.toISOString(),
    }),
  }),
});

// Upload URL Response Type
const UploadUrlResponseType = builder.objectType('UploadUrlResponse', {
  fields: (t) => ({
    uploadUrl: t.string({ description: 'Pre-signed S3 upload URL' }),
    photoId: t.string({ description: 'Database ID of the photo record' }),
    filename: t.string({ description: 'Generated filename for the photo' }),
  }),
});

// Queries
builder.queryType({
  fields: (t) => ({
    hello: t.string({
      description: 'A simple hello world query',
      resolve: () => 'Hello, World! GraphQL server is running.',
    }),
    serverStatus: t.string({
      description: 'Check server status',
      resolve: () => `Server is running at ${new Date().toISOString()}`,
    }),
    vehicles: t.field({
      type: [VehicleType],
      description: 'Get all vehicles',
      resolve: () => Database.getAllVehicles(),
    }),
    vehicle: t.field({
      type: VehicleType,
      description: 'Get a vehicle by ID',
      args: {
        id: t.arg.string({ required: true }),
      },
      resolve: (parent, { id }) => {
        const vehicle = Database.getVehicle(id);
        if (!vehicle) {
          throw new Error(`Vehicle with ID ${id} not found`);
        }
        return vehicle;
      },
    }),
    photos: t.field({
      type: [PhotoType],
      description: 'Get all photos',
      resolve: () => Database.getAllPhotos(),
    }),
  }),
});

// Mutations
builder.mutationType({
  fields: (t) => ({
    ping: t.string({
      description: 'A simple ping mutation',
      resolve: () => 'pong',
    }),
    generateUploadUrl: t.field({
      type: UploadUrlResponseType,
      description: 'Generate a pre-signed S3 upload URL for a vehicle photo',
      args: {
        vehicleId: t.arg.string({ required: true, description: 'ID of the vehicle' }),
        fileType: t.arg.string({ required: true, description: 'MIME type of the file (e.g., image/jpeg)' }),
      },
      resolve: async (parent, { vehicleId, fileType }) => {
        try {
          // Verify vehicle exists
          const vehicle = Database.getVehicle(vehicleId);
          if (!vehicle) {
            throw new Error(`Vehicle with ID ${vehicleId} not found`);
          }

          // Generate a unique key for the file
          const timestamp = Date.now();
          const fileExtension = fileType.split('/')[1] || 'jpg';
          const filename = `${timestamp}.${fileExtension}`;
          const key = `vehicles/${vehicleId}/photos/${filename}`;
          
          const uploadUrl = await generateUploadUrl(key, fileType);
          
          // Save photo reference to database
          const photo = Database.createPhoto({
            vehicleId,
            filename,
            uploadUrl,
            uploaded: false,
          });
          
          console.log(`📸 Generated upload URL for vehicle ${vehicleId}: ${key}, photoId: ${photo.id}`);
          
          return {
            uploadUrl,
            photoId: photo.id,
            filename,
          };
        } catch (error) {
          console.error('Failed to generate upload URL:', error);
          throw new Error(`Failed to generate upload URL: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      },
    }),
    markPhotoUploaded: t.field({
      type: PhotoType,
      description: 'Mark a photo as successfully uploaded',
      args: {
        photoId: t.arg.string({ required: true, description: 'ID of the photo' }),
      },
      resolve: (parent, { photoId }) => {
        const photo = Database.updatePhoto(photoId, { uploaded: true });
        if (!photo) {
          throw new Error(`Photo with ID ${photoId} not found`);
        }
        return photo;
      },
    }),
    createVehicle: t.field({
      type: VehicleType,
      description: 'Create a new vehicle',
      args: {
        make: t.arg.string({ required: true }),
        model: t.arg.string({ required: true }),
        year: t.arg.int({ required: true }),
        vin: t.arg.string({ required: true }),
      },
      resolve: (parent, args) => {
        const vehicleId = `vehicle_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        return Database.createVehicle({
          id: vehicleId,
          ...args,
        });
      },
    }),
  }),
});

export const schema = builder.toSchema();