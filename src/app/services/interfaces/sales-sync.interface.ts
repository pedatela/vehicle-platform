import { Vehicle } from "../../../domain/vehicles/entities/vehicle";

export interface SalesSyncPort {
  notifyVehicleCreated(vehicle: Vehicle): Promise<void>;
  notifyVehicleUpdated(vehicle: Vehicle): Promise<void>;
  notifyVehicleDeleted(vehicleId: string): Promise<void>;
}

export type SalesSyncClientOptions = {
  baseUrl?: string | undefined;
  token?: string | undefined;
};
