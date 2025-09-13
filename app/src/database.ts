// Database service that can work with or without Prisma

// Fallback types when Prisma is not available
interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  vin: string;
  mileage?: number | null;
  condition?: string | null;
  createdAt: Date;
  updatedAt: Date;
  photos?: Photo[];
}

interface Photo {
  id: string;
  vehicleId: string;
  filename: string;
  url: string;
  uploadUrl?: string | null;
  uploaded: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type { Vehicle, Photo };

// Dynamic Prisma import with fallback
let prisma: any = null;
let usePrisma = false;

async function initializePrisma() {
  try {
    // Try to import Prisma client
    const { PrismaClient } = await import('@prisma/client');
    prisma = new PrismaClient({
      log: ['error', 'warn'],
    });
    usePrisma = true;
    console.log('✅ Using PostgreSQL with Prisma');
  } catch (error) {
    console.log('⚠️  Prisma client not available, falling back to in-memory database');
    usePrisma = false;
  }
}

// Initialize Prisma on module load
await initializePrisma();

// In-memory fallback storage
const vehicles = new Map<string, Vehicle>();
const photos = new Map<string, Photo>();

export class Database {
  static async createVehicle(data: any): Promise<Vehicle> {
    if (usePrisma && prisma) {
      try {
        return await prisma.vehicle.create({ data });
      } catch (error) {
        console.error('Prisma error, falling back to in-memory:', error);
        usePrisma = false;
      }
    }
    
    // Fallback to in-memory
    const vehicle: Vehicle = {
      id: `vehicle_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
      photos: [],
    };
    vehicles.set(vehicle.id, vehicle);
    return vehicle;
  }

  static async getVehicle(id: string): Promise<(Vehicle & { photos: Photo[] }) | null> {
    if (usePrisma && prisma) {
      try {
        return await prisma.vehicle.findUnique({
          where: { id },
          include: { photos: true },
        });
      } catch (error) {
        console.error('Prisma error, falling back to in-memory:', error);
        usePrisma = false;
      }
    }
    
    // Fallback to in-memory
    const vehicle = vehicles.get(id);
    if (!vehicle) return null;
    
    const vehiclePhotos = Array.from(photos.values()).filter(p => p.vehicleId === id);
    return { ...vehicle, photos: vehiclePhotos };
  }

  static async getVehicleByVin(vin: string): Promise<(Vehicle & { photos: Photo[] }) | null> {
    if (usePrisma && prisma) {
      try {
        return await prisma.vehicle.findUnique({
          where: { vin },
          include: { photos: true },
        });
      } catch (error) {
        console.error('Prisma error, falling back to in-memory:', error);
        usePrisma = false;
      }
    }
    
    // Fallback to in-memory
    const vehicle = Array.from(vehicles.values()).find(v => v.vin === vin);
    if (!vehicle) return null;
    
    const vehiclePhotos = Array.from(photos.values()).filter(p => p.vehicleId === vehicle.id);
    return { ...vehicle, photos: vehiclePhotos };
  }

  static async createPhoto(data: any): Promise<Photo> {
    if (usePrisma && prisma) {
      try {
        return await prisma.photo.create({ data });
      } catch (error) {
        console.error('Prisma error, falling back to in-memory:', error);
        usePrisma = false;
      }
    }
    
    // Fallback to in-memory
    const photo: Photo = {
      id: `photo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      vehicleId: data.vehicleId || (data.vehicle?.connect?.id),
      filename: data.filename,
      url: data.url,
      uploadUrl: data.uploadUrl,
      uploaded: data.uploaded || false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    photos.set(photo.id, photo);
    
    // Add to vehicle if it exists
    const vehicle = vehicles.get(photo.vehicleId);
    if (vehicle && vehicle.photos) {
      vehicle.photos.push(photo);
    }
    
    return photo;
  }

  static async getPhoto(id: string): Promise<Photo | null> {
    if (usePrisma && prisma) {
      try {
        return await prisma.photo.findUnique({ where: { id } });
      } catch (error) {
        console.error('Prisma error, falling back to in-memory:', error);
        usePrisma = false;
      }
    }
    
    // Fallback to in-memory
    return photos.get(id) || null;
  }

  static async updatePhoto(id: string, updates: any): Promise<Photo | null> {
    if (usePrisma && prisma) {
      try {
        return await prisma.photo.update({
          where: { id },
          data: updates,
        });
      } catch (error) {
        if (error instanceof Error && error.message.includes('P2025')) {
          return null; // Record not found
        }
        console.error('Prisma error, falling back to in-memory:', error);
        usePrisma = false;
      }
    }
    
    // Fallback to in-memory
    const photo = photos.get(id);
    if (photo) {
      Object.assign(photo, updates, { updatedAt: new Date() });
      return photo;
    }
    return null;
  }

  static async getAllVehicles(): Promise<(Vehicle & { photos: Photo[] })[]> {
    if (usePrisma && prisma) {
      try {
        return await prisma.vehicle.findMany({
          include: { photos: true },
        });
      } catch (error) {
        console.error('Prisma error, falling back to in-memory:', error);
        usePrisma = false;
      }
    }
    
    // Fallback to in-memory
    return Array.from(vehicles.values()).map(vehicle => ({
      ...vehicle,
      photos: Array.from(photos.values()).filter(p => p.vehicleId === vehicle.id),
    }));
  }

  static async getAllPhotos(): Promise<Photo[]> {
    if (usePrisma && prisma) {
      try {
        return await prisma.photo.findMany();
      } catch (error) {
        console.error('Prisma error, falling back to in-memory:', error);
        usePrisma = false;
      }
    }
    
    // Fallback to in-memory
    return Array.from(photos.values());
  }

  static async getVehiclePhotos(vehicleId: string): Promise<Photo[]> {
    if (usePrisma && prisma) {
      try {
        return await prisma.photo.findMany({
          where: { vehicleId },
        });
      } catch (error) {
        console.error('Prisma error, falling back to in-memory:', error);
        usePrisma = false;
      }
    }
    
    // Fallback to in-memory
    return Array.from(photos.values()).filter(photo => photo.vehicleId === vehicleId);
  }

  // Utility methods for testing and setup
  static async seedDatabase(): Promise<void> {
    if (usePrisma && prisma) {
      try {
        // Check if data already exists
        const existingVehicles = await prisma.vehicle.count();
        if (existingVehicles > 0) {
          console.log('Database already seeded, skipping...');
          return;
        }

        console.log('Seeding PostgreSQL database with test data...');
        
        await prisma.vehicle.createMany({
          data: [
            {
              make: 'Toyota',
              model: 'Camry',
              year: 2020,
              vin: 'TEST123456789',
              mileage: 35000,
              condition: 'Good',
            },
            {
              make: 'Honda',
              model: 'Civic',
              year: 2019,
              vin: 'TEST987654321',
              mileage: 42000,
              condition: 'Excellent',
            },
          ],
        });

        console.log('✅ PostgreSQL database seeded successfully');
        return;
      } catch (error) {
        console.error('Failed to seed PostgreSQL, falling back to in-memory:', error);
        usePrisma = false;
      }
    }
    
    // Fallback to in-memory seeding
    if (vehicles.size === 0) {
      console.log('Seeding in-memory database with test data...');
      
      await this.createVehicle({
        make: 'Toyota',
        model: 'Camry',
        year: 2020,
        vin: 'TEST123456789',
        mileage: 35000,
        condition: 'Good',
      });

      await this.createVehicle({
        make: 'Honda',
        model: 'Civic',
        year: 2019,
        vin: 'TEST987654321',
        mileage: 42000,
        condition: 'Excellent',
      });

      console.log('✅ In-memory database seeded successfully');
    }
  }

  static async clearDatabase(): Promise<void> {
    if (usePrisma && prisma) {
      try {
        await prisma.photo.deleteMany();
        await prisma.appraisal.deleteMany();
        await prisma.vehicle.deleteMany();
        return;
      } catch (error) {
        console.error('Failed to clear PostgreSQL, falling back to in-memory:', error);
        usePrisma = false;
      }
    }
    
    // Fallback to in-memory clearing
    photos.clear();
    vehicles.clear();
  }

  static async connect(): Promise<void> {
    if (usePrisma && prisma) {
      try {
        await prisma.$connect();
        console.log('✅ Connected to PostgreSQL database');
      } catch (error) {
        console.error('Failed to connect to PostgreSQL:', error);
        usePrisma = false;
        console.log('✅ Using in-memory database fallback');
      }
    } else {
      console.log('✅ Using in-memory database');
    }
  }

  static async disconnect(): Promise<void> {
    if (usePrisma && prisma) {
      await prisma.$disconnect();
    }
  }
}