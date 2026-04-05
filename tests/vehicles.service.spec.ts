import { describe, it, expect, beforeEach, vi } from 'vitest';
import { VehiclesService } from '../src/app/services/vehicles.service';
import { InMemoryVehiclesRepository } from '../src/infra/repositories/in-memory/in-memory-vehicles.repository';
import { Vehicle, VehicleAttributes } from '../src/domain/vehicles/entities/vehicle';
import { SalesSyncPort } from '../src/app/services/sales-sync.client';

const makeVehicle = (attrs: Partial<VehicleAttributes> = {}) =>
  Vehicle.create({
    brand: 'Tesla',
    model: 'Model 3',
    year: 2024,
    color: 'Blue',
    price: 250000,
    isSold: false,
    buyerId: null,
    ...attrs
  });

describe('VehiclesService', () => {
  let repository: InMemoryVehiclesRepository;
  let service: VehiclesService;
  let salesSync: SalesSyncPort;
  let notifyCreatedMock: ReturnType<typeof vi.fn>;
  let notifyUpdatedMock: ReturnType<typeof vi.fn>;
  let notifyDeletedMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    repository = new InMemoryVehiclesRepository();
    notifyCreatedMock = vi.fn().mockResolvedValue(undefined);
    notifyUpdatedMock = vi.fn().mockResolvedValue(undefined);
    notifyDeletedMock = vi.fn().mockResolvedValue(undefined);
    salesSync = {
      notifyVehicleCreated: notifyCreatedMock,
      notifyVehicleUpdated: notifyUpdatedMock,
      notifyVehicleDeleted: notifyDeletedMock
    };
    service = new VehiclesService(repository, salesSync);
  });

  it('filters vehicles by status and orders available items by price', async () => {
    const vehicles = [
      makeVehicle({ price: 180000 }),
      makeVehicle({ price: 220000, isSold: true, buyerId: 'buyer-1' }),
      makeVehicle({ price: 80000 })
    ];

    for (const vehicle of vehicles) {
      await repository.create(vehicle);
    }

    const result = await service.list({ status: 'available' });

    expect(result).toHaveLength(2);
    expect(result[0].price).toBe(80000);
    expect(result[1].price).toBe(180000);
  });

  it('returns null when updating a non-existent vehicle', async () => {
    const response = await service.update('missing-id', { color: 'Black' });
    expect(response).toBeNull();
  });

  it('creates multiple vehicles at once', async () => {
    const payload = [
      {
        brand: 'Ford',
        model: 'Mustang',
        year: 2022,
        color: 'Red',
        price: 350000,
        isSold: false
      },
      {
        brand: 'Chevrolet',
        model: 'Camaro',
        year: 2021,
        color: 'Yellow',
        price: 330000,
        isSold: false
      }
    ];

    const created = await service.createMany(payload);
    expect(created).toHaveLength(2);

    const stored = await repository.list();
    expect(stored).toHaveLength(2);
    expect(stored.map((vehicle) => vehicle.brand)).toContain('Ford');
    expect(stored.map((vehicle) => vehicle.brand)).toContain('Chevrolet');
  });

  it('notifies Sales when creating vehicles', async () => {
    const attrs: VehicleAttributes = {
      brand: 'BYD',
      model: 'Seal',
      year: 2024,
      color: 'Blue',
      price: 220000,
      isSold: false
    };

    await service.create(attrs);

    expect(notifyCreatedMock).toHaveBeenCalledTimes(1);
  });

  it('notifies Sales when updating vehicles', async () => {
    const vehicle = makeVehicle();
    await repository.create(vehicle);

    await service.update(vehicle.id, { color: 'Black' });

    expect(notifyUpdatedMock).toHaveBeenCalledTimes(1);
  });

  it('notifies Sales when deleting vehicles', async () => {
    const vehicle = makeVehicle();
    await repository.create(vehicle);

    await service.delete(vehicle.id);

    expect(notifyDeletedMock).toHaveBeenCalledWith(vehicle.id);
  });

  it('ignores sync errors without breaking the main flow', async () => {
    const vehicle = makeVehicle();
    await repository.create(vehicle);

    notifyUpdatedMock.mockRejectedValueOnce(new Error('network'));

    await expect(service.update(vehicle.id, { color: 'Silver' })).resolves.not.toThrow();
  });
});
