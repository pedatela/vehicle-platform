import { VehiclesService } from '../services/vehicles.service';
import { VehiclesRepository } from '../../domain/vehicles/repositories/vehicles-repository';
import { InMemoryVehiclesRepository } from '../../infra/repositories/in-memory/in-memory-vehicles.repository';
import { HttpSalesSyncClient } from '../services/sales-sync.client';
import { salesSyncConfig } from '../../config/sales-sync';

const createSalesSyncClient = () => {
  if (!salesSyncConfig.baseUrl) {
    return undefined;
  }

  return new HttpSalesSyncClient({
    baseUrl: salesSyncConfig.baseUrl,
    token: salesSyncConfig.token || undefined
  });
};

export const createVehiclesService = (
  repository: VehiclesRepository = new InMemoryVehiclesRepository()
): VehiclesService => new VehiclesService(repository, createSalesSyncClient());
