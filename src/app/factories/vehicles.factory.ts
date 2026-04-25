import { VehiclesService } from '../services/vehicles.service';
import { VehiclesRepository } from '../../domain/vehicles/repositories/vehicles-repository';
import { InMemoryVehiclesRepository } from '../../infra/repositories/in-memory/in-memory-vehicles.repository';
import { PostgresVehiclesRepository } from '../../infra/repositories/postgres/postgres-vehicles.repository';
import { HttpSalesSyncClient } from '../services/sales-sync.client';
import { salesSyncConfig } from '../../config/sales-sync';
import { databaseConfig } from '../../config/database';

const createVehiclesRepository = (): VehiclesRepository =>
  databaseConfig.enabled ? new PostgresVehiclesRepository() : new InMemoryVehiclesRepository();

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
  repository: VehiclesRepository = createVehiclesRepository()
): VehiclesService => {
  if (!singleton) {
    singleton = new VehiclesService(repository, createSalesSyncClient());
  }

  return singleton;
};

let singleton: VehiclesService | null = null;
