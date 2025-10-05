import { apiRequest } from "@/lib/queryClient";

export interface VehicleData {
  registration: string;
  make: string;
  model: string;
  colour: string;
  fuelType: string;
  year: number;
}

export const vehicleService = {
  async lookupByRegistration(registration: string): Promise<VehicleData> {
    const response = await apiRequest("GET", `/api/vehicles/lookup/${registration}`);
    return response.json();
  },

  async create(vehicleData: Omit<VehicleData, 'id'>): Promise<VehicleData> {
    const response = await apiRequest("POST", "/api/vehicles", vehicleData);
    return response.json();
  },

  async getAll(): Promise<VehicleData[]> {
    const response = await apiRequest("GET", "/api/vehicles");
    return response.json();
  },

  async getById(id: string): Promise<VehicleData> {
    const response = await apiRequest("GET", `/api/vehicles/${id}`);
    return response.json();
  },

  async update(id: string, vehicleData: Partial<VehicleData>): Promise<VehicleData> {
    const response = await apiRequest("PATCH", `/api/vehicles/${id}`, vehicleData);
    return response.json();
  },

  async delete(id: string): Promise<void> {
    await apiRequest("DELETE", `/api/vehicles/${id}`);
  }
};
