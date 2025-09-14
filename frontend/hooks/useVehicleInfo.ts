import { useQuery } from "@tanstack/react-query";

export interface VehicleInfo {
  Make: string;
  Model: string;
  ModelYear: string;
  VIN: string;
  ErrorText: string;
  ErrorCode: string;
}

export interface NHTSAResponse {
  Count: number;
  Message: string;
  SearchCriteria: string;
  Results: VehicleInfo[];
}

const fetchVehicleInfo = async (vin: string): Promise<NHTSAResponse> => {
  const response = await fetch(
    `https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValuesExtended/${vin}?format=json`
  );
  
  if (!response.ok) {
    throw new Error('Failed to fetch vehicle information');
  }
  
  return response.json();
};

export const useVehicleInfo = (vin: string) => {
  return useQuery({
    queryKey: ['vehicleInfo', vin],
    queryFn: () => fetchVehicleInfo(vin),
    enabled: vin.length >= 17, // VINs are 17 characters
    staleTime: 1000 * 60 * 60, // 1 hour
  });
};