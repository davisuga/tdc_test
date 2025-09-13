// Simple in-memory database for demo purposes
// In production, this would be replaced with actual Prisma/PostgreSQL

interface Photo {
  id: string;
  vehicleId: string;
  filename: string;
  uploadUrl: string;
  uploaded: boolean;
  createdAt: Date;
}

interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  vin: string;
  photos: Photo[];
}

// In-memory storage
const vehicles = new Map<string, Vehicle>();
const photos = new Map<string, Photo>();

export class Database {
  static createVehicle(data: Omit<Vehicle, 'photos'>): Vehicle {
    const vehicle: Vehicle = {
      ...data,
      photos: [],
    };
    vehicles.set(vehicle.id, vehicle);
    return vehicle;
  }

  static getVehicle(id: string): Vehicle | undefined {
    return vehicles.get(id);
  }

  static createPhoto(data: Omit<Photo, 'id' | 'createdAt'>): Photo {
    const photo: Photo = {
      ...data,
      id: `photo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
    };
    
    photos.set(photo.id, photo);
    
    // Add to vehicle if it exists
    const vehicle = vehicles.get(photo.vehicleId);
    if (vehicle) {
      vehicle.photos.push(photo);
    }
    
    return photo;
  }

  static getPhoto(id: string): Photo | undefined {
    return photos.get(id);
  }

  static updatePhoto(id: string, updates: Partial<Photo>): Photo | undefined {
    const photo = photos.get(id);
    if (photo) {
      Object.assign(photo, updates);
      return photo;
    }
    return undefined;
  }

  static getAllVehicles(): Vehicle[] {
    return Array.from(vehicles.values());
  }

  static getAllPhotos(): Photo[] {
    return Array.from(photos.values());
  }

  static getVehiclePhotos(vehicleId: string): Photo[] {
    return Array.from(photos.values()).filter(photo => photo.vehicleId === vehicleId);
  }
}

// Initialize with some test data
Database.createVehicle({
  id: 'vehicle_1',
  make: 'Toyota',
  model: 'Camry',
  year: 2020,
  vin: 'TEST123456789',
});

Database.createVehicle({
  id: 'vehicle_2',
  make: 'Honda',
  model: 'Civic',
  year: 2019,
  vin: 'TEST987654321',
});

export { Vehicle, Photo };