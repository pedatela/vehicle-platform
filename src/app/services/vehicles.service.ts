import {
  Vehicle,
  VehicleAttributes,
} from "../../domain/vehicles/entities/vehicle";
import { VehiclesRepository } from "../../domain/vehicles/repositories/vehicles-repository";
import { logger } from "../logger";
import { SalesSyncPort } from "./interfaces/sales-sync.interface";

export type VehicleStatusFilter = "available" | "sold";

export interface VehicleListFilter {
  status?: VehicleStatusFilter;
}

export class VehiclesService {
  constructor(
    private readonly repository: VehiclesRepository,
    private readonly salesSync?: SalesSyncPort,
  ) {}
  async list(filter?: VehicleListFilter): Promise<Vehicle[]> {
    logger.info("Listando veículos", { filter: filter ?? null });
    let vehicles = await this.repository.list();

    if (filter?.status) {
      vehicles = vehicles
        .filter((vehicle) =>
          filter.status === "sold" ? vehicle.isSold : !vehicle.isSold,
        )
        .sort((a, b) => a.price - b.price);
    }

    return vehicles;
  }

  async getById(id: string): Promise<Vehicle | null> {
    logger.info("Buscando veículo por ID", { id });
    const vehicle = await this.repository.findById(id);

    if (!vehicle) {
      logger.warn("Veículo não encontrado", { id });
    }

    return vehicle;
  }

  async create(attrs: VehicleAttributes): Promise<Vehicle> {
    logger.info("Criando veículo", {
      brand: attrs.brand,
      model: attrs.model,
      year: attrs.year,
    });
    const vehicle = Vehicle.create(attrs);
    await this.repository.create(vehicle);
    logger.info("Veículo criado", { id: vehicle.id });
    await this.notifySalesSync(
      (client) => client.notifyVehicleCreated(vehicle),
      { vehicleId: vehicle.id, operation: "create" },
    );
    return vehicle;
  }

  async createMany(attrsList: VehicleAttributes[]): Promise<Vehicle[]> {
    logger.info("Criando múltiplos veículos", { total: attrsList.length });
    const created: Vehicle[] = [];

    for (const attrs of attrsList) {
      const vehicle = await this.create(attrs);
      created.push(vehicle);
    }

    logger.info("Criação em lote concluída", { total: created.length });
    return created;
  }

  async update(
    id: string,
    attrs: Partial<VehicleAttributes>,
  ): Promise<Vehicle | null> {
    logger.info("Atualizando veículo", { id, attrs });
    const vehicle = await this.repository.findById(id);

    if (!vehicle) {
      logger.warn("Veículo para atualização não encontrado", { id });
      return null;
    }

    vehicle.update(attrs);
    await this.repository.update(vehicle);
    logger.info("Veículo atualizado", { id: vehicle.id });
    await this.notifySalesSync(
      (client) => client.notifyVehicleUpdated(vehicle),
      { vehicleId: vehicle.id, operation: "update" },
    );

    return vehicle;
  }

  async delete(id: string): Promise<Vehicle | null> {
    logger.info("Removendo veículo", { id });
    const removed = await this.repository.delete(id);

    if (!removed) {
      logger.warn("Veículo para remoção não encontrado", { id });
      return null;
    }

    logger.info("Veículo removido", { id: removed.id });
    await this.notifySalesSync(
      (client) => client.notifyVehicleDeleted(removed.id),
      { vehicleId: removed.id, operation: "delete" },
    );
    return removed;
  }

  private async notifySalesSync(
    callback: (salesSync: SalesSyncPort) => Promise<void>,
    context: Record<string, unknown>,
  ) {
    if (!this.salesSync) {
      return;
    }

    try {
      await callback(this.salesSync);
    } catch (error) {
      logger.warn("Falha ao sincronizar com Sales", {
        ...context,
        error: (error as Error).message,
      });
    }
  }
}
